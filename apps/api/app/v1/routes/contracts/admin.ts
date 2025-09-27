import { Hono } from "hono";
import { z } from "zod";

const admin = new Hono();

const projectSchema = z.object({
  amount: z.string()
});

admin.post("/project-complete", async (c) => {
  const body = await c.req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  const amount = parsed.data.amount;
  // amount is in tokens (no decimals handling here). If your token has decimals, adjust.
  try {
    const tx = await carbonManager.projectComplete(amount);
    const receipt = await tx.wait();
    return c.json({ success: true, txHash: receipt.transactionHash });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

router.post("/withdraw", async (c) => {
  try {
    const tx = await carbonManager.withdraw();
    const receipt = await tx.wait();
    return c.json({ success: true, txHash: receipt.transactionHash });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

export default router;