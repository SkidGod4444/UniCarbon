import { Hono } from "hono";
import { z } from "zod";
import { Interface } from "ethers";
import { provider } from "@/utilities/config";
import { prisma } from "@unicarbon/db";

const tx = new Hono();

const bodySchema = z.object({
  txHash: z.string()
});

// We'll use the ABI interface to parse logs
const managerInterface = new Interface([
  "event CreditsPurchased(address indexed buyer, uint256 amount, uint256 paid)",
  "event CreditsOffset(address indexed company, uint256 amount, uint256 nftId)"
]);

tx.post("/verify", async (c) => {
  const body = await c.req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const { txHash } = parsed.data;

  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return c.json({ error: "Tx receipt not found yet" }, 404);

    // Parse logs for manager events
    const logs = receipt.logs.filter(
      (l) =>
        l.address.toLowerCase() ===
        String(process.env.CARBON_MANAGER_ADDRESS).toLowerCase()
    );

    for (const log of logs) {
      try {
        const parsedLog = managerInterface.parseLog(log);
        if (parsedLog!.name === "CreditsPurchased") {
          const buyer = parsedLog!.args[0];
          const amount = parsedLog!.args[1].toString();
          const paid = parsedLog!.args[2].toString();

          // Find company by wallet
          const company = await prisma.companies.findUnique({
            where: { wallet: buyer.toLowerCase() },
          });

          const companyId = company?.id;
          if (!companyId) continue;

          // create credit record
          await prisma.carbonCredits.create({
            data: {
              company_id: companyId,
              amount: parseFloat(amount),
              type: "purchase",
              tx_hash: txHash,
              nft_id: 0, // No NFT for purchase, set to 0 or a sentinel value
              project_name: company?.name ?? "",
              created_at: new Date(),
            },
          });

          if (company) {
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                total_purchased: {
                  increment: parseFloat(amount),
                },
              },
            });
          }
        } else if (parsedLog?.name === "CreditsOffset") {
          const companyAddr = parsedLog.args[0];
          const amount = parsedLog.args[1].toString();
          const nftId = parseInt(parsedLog.args[2].toString(), 10);

          const company = await prisma.companies.findUnique({
            where: { wallet: companyAddr.toLowerCase() },
          });
          const companyId = company?.id;
          if (!companyId) continue;

          const credit = await prisma.carbonCredits.create({
            data: {
              company_id: companyId,
              amount: parseFloat(amount),
              type: "offset",
              tx_hash: txHash,
              nft_id: nftId,
              project_name: company?.name ?? "",
              created_at: new Date(),
            },
          });

          // store NFT record placeholder (metadata can be fetched separately)
          await prisma.nftProofs.create({
            data: {
              company_id: companyId,
              offset_id: credit.id,
              metadata_uri: "{}", // Placeholder, update as needed
              created_at: new Date(),
            },
          });

          if (company) {
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                total_offset: {
                  increment: parseFloat(amount),
                },
              },
            });
          }
        }
      } catch (err) {
        // not our event or parse failed - skip
        continue;
      }
    }

    return c.json({ success: true, receipt });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

export default tx;