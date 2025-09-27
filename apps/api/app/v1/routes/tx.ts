import { Hono } from "hono";
import { z } from "zod";
import { Interface } from "ethers";
import { provider } from "../../../utilities/config";
import { prisma } from "@unicarbon/db";
import type { 
  ApiResponse, 
  VerifyTxRequest, 
  VerifyTxResponse, 
  ProcessedEvent 
} from "../types/api";

const tx = new Hono();

// Schema for transaction verification
const verifyTxSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash")
});

// ABI interface for parsing logs
const managerInterface = new Interface([
  "event CreditsPurchased(address indexed buyer, uint256 amount, uint256 paid)",
  "event CreditsOffset(address indexed company, uint256 amount, uint256 nftId)"
]);

/**
 * @route POST /tx/verify
 * @description Verify any on-chain transaction (buyCredits or offset) by fetching the receipt, parsing emitted events, and persisting in DB
 */
tx.post("/verify", async (c): Promise<Response> => {
  const body: VerifyTxRequest = await c.req.json();
  const parsed = verifyTxSchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  const { txHash } = parsed.data;

  try {
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      const response: ApiResponse = { 
        success: false, 
        error: "Transaction not found or not yet mined" 
      };
      return c.json(response, 404);
    }

    if (receipt.status !== 1) {
      const response: ApiResponse = { 
        success: false, 
        error: "Transaction failed" 
      };
      return c.json(response, 400);
    }

    // Filter logs for CarbonOffsetManager events
    const carbonManagerAddress = process.env.CARBON_MANAGER_ADDRESS?.toLowerCase();
    if (!carbonManagerAddress) {
      const response: ApiResponse = { 
        success: false, 
        error: "Carbon manager address not configured" 
      };
      return c.json(response, 500);
    }

    const logs = receipt.logs.filter(
      (log) => log.address.toLowerCase() === carbonManagerAddress
    );

    const processedEvents: ProcessedEvent[] = [];

    for (const log of logs) {
      try {
        const parsedLog = managerInterface.parseLog(log);
        
        if (parsedLog!.name === "CreditsPurchased") {
          const buyer = parsedLog!.args[0];
          const amount = parsedLog!.args[1].toString();
          const paid = parsedLog!.args[2].toString();

          // Find or create company
          let company = await prisma.companies.findUnique({
            where: { wallet: buyer.toLowerCase() }
          });

          if (!company) {
            // Create company if it doesn't exist
            company = await prisma.companies.create({
              data: {
                name: `Company ${buyer.slice(0, 8)}...`,
                wallet: buyer.toLowerCase(),
                total_purchased: 0,
                total_offset: 0,
                created_at: new Date()
              }
            });
          }

          // Create credit record
          const creditRecord = await prisma.carbonCredits.create({
            data: {
              company_id: company.id,
              amount: parseFloat(amount),
              type: "purchase",
              tx_hash: txHash,
              nft_id: 0, // No NFT for purchase
              project_name: company.name,
              created_at: new Date()
            }
          });

          // Update company totals
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              total_purchased: {
                increment: parseFloat(amount)
              }
            }
          });

          const purchaseEvent: ProcessedEvent = {
            type: "purchase",
            buyer: buyer,
            amount: amount,
            paid: paid,
            creditRecordId: creditRecord.id
          };
          processedEvents.push(purchaseEvent);

        } else if (parsedLog!.name === "CreditsOffset") {
          const companyAddr = parsedLog!.args[0];
          const amount = parsedLog!.args[1].toString();
          const nftId = parseInt(parsedLog!.args[2].toString(), 10);

          // Find company
          const company = await prisma.companies.findUnique({
            where: { wallet: companyAddr.toLowerCase() }
          });

          if (!company) {
            console.warn(`Company not found for wallet ${companyAddr}`);
            continue;
          }

          // Create credit record
          const creditRecord = await prisma.carbonCredits.create({
            data: {
              company_id: company.id,
              amount: parseFloat(amount),
              type: "offset",
              tx_hash: txHash,
              nft_id: nftId,
              project_name: company.name,
              created_at: new Date()
            }
          });

          // Create NFT proof record
          await prisma.nftProofs.create({
            data: {
              company_id: company.id,
              offset_id: creditRecord.id,
              metadata_uri: `{"nftId":${nftId},"amount":"${amount}","company":"${companyAddr}","timestamp":"${Date.now()}"}`,
              created_at: new Date()
            }
          });

          // Update company totals
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              total_offset: {
                increment: parseFloat(amount)
              }
            }
          });

          const offsetEvent: ProcessedEvent = {
            type: "offset",
            company: companyAddr,
            amount: amount,
            nftId: nftId,
            creditRecordId: creditRecord.id
          };
          processedEvents.push(offsetEvent);
        }
      } catch (err) {
        // Skip logs that don't match our interface
        console.warn("Failed to parse log:", err);
        continue;
      }
    }

    const verifyResponse: VerifyTxResponse = {
      txHash: txHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      eventsProcessed: processedEvents.length,
      events: processedEvents,
      message: "Transaction verified and events processed successfully"
    };

    const response: ApiResponse<VerifyTxResponse> = {
      success: true,
      data: verifyResponse
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error verifying transaction:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to verify transaction" 
    };
    return c.json(response, 500);
  }
});

export default tx;
