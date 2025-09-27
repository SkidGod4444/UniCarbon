import { prisma } from "@unicarbon/db";
import { Hono } from "hono";
import { z } from "zod";

const company = new Hono();

const createSchema = z.object({
  name: z.string(),
  wallet: z.string()
});

company.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error }, 400);

  try {
    const comp = await prisma.companies.create({
      data: {
        name: parsed.data.name,
        wallet: parsed.data.wallet.toLowerCase(),
        created_at: new Date()
      }
    });
    return c.json(comp);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

company.get("/:wallet", async (c) => {
  const wallet = c.req.param("wallet").toLowerCase();
  try {
    const comp = await prisma.companies.findUnique({
      where: { wallet },
    });
    if (!comp) return c.json({ error: "Company not found" }, 404);
    return c.json(comp);
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
});

export default company;