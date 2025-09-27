import { Hono } from "hono";
import { z } from "zod";
import { carbonManager, carbonCredit } from "../../../utilities/contracts";
import { provider } from "../../../utilities/config";
import type { 
  ApiResponse, 
  ProjectCompleteRequest, 
  ProjectCompleteResponse, 
  PriceResponse, 
  BalanceResponse 
} from "../types/api";

const admin = new Hono();

// Schema for project completion
const projectCompleteSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer")
});

// Schema for price update
const priceUpdateSchema = z.object({
  pricePerCredit: z.string().regex(/^\d+$/, "Price must be a positive integer")
});

/**
 * @route POST /admin/project-complete
 * @description Mint new CarbonCredits to central wallet
 */
admin.post("/project-complete", async (c): Promise<Response> => {
  const body: ProjectCompleteRequest = await c.req.json();
  const parsed = projectCompleteSchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  const amount = parsed.data.amount;

  try {
    const tx = await carbonManager.projectComplete(amount);
    const receipt = await tx.wait();
    
    const response: ApiResponse<ProjectCompleteResponse> = { 
      success: true, 
      data: {
        txHash: receipt.transactionHash,
        amount: amount,
        message: "Successfully minted credits to central wallet"
      }
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error in project-complete:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to complete project" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route POST /admin/withdraw
 * @description Withdraw ETH payments collected from buyCredits
 */
admin.post("/withdraw", async (c): Promise<Response> => {
  try {
    const tx = await carbonManager.withdraw();
    const receipt = await tx.wait();
    
    const response: ApiResponse<{ txHash: string; message: string }> = { 
      success: true, 
      data: {
        txHash: receipt.transactionHash,
        message: "Successfully withdrew ETH payments"
      }
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error in withdraw:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to withdraw" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route GET /admin/price
 * @description Get current price per credit
 */
admin.get("/price", async (c): Promise<Response> => {
  try {
    const pricePerCredit = await carbonManager.pricePerCredit();
    
    const response: ApiResponse<PriceResponse> = {
      success: true,
      data: {
        pricePerCredit: pricePerCredit.toString(),
        pricePerCreditWei: pricePerCredit.toString(),
        pricePerCreditEth: (Number(pricePerCredit) / 1e18).toFixed(6)
      }
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error getting price:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get price" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route POST /admin/price
 * @description Update price per credit (if contract supports it)
 */
admin.post("/price", async (c): Promise<Response> => {
  const body = await c.req.json();
  const parsed = priceUpdateSchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  // Note: The current contract doesn't have a setPrice function
  // This would need to be added to the contract or handled differently
  const response: ApiResponse = { 
    success: false, 
    error: "Price update not supported by current contract",
    message: "The CarbonOffsetManager contract doesn't have a setPrice function"
  };
  return c.json(response, 400);
});

/**
 * @route GET /admin/balance
 * @description Check central wallet balance for auditing
 */
admin.get("/balance", async (c): Promise<Response> => {
  try {
    const centralWallet = await carbonManager.centralWallet();
    const creditBalance = await carbonCredit.balanceOf(centralWallet);
    const ethBalance = await provider.getBalance(centralWallet);
    
    const response: ApiResponse<BalanceResponse> = {
      success: true,
      data: {
        centralWallet: centralWallet,
        creditBalance: creditBalance.toString(),
        ethBalance: ethBalance.toString(),
        ethBalanceEth: (Number(ethBalance) / 1e18).toFixed(6)
      }
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error getting balance:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get balance" 
    };
    return c.json(response, 500);
  }
});

export default admin;
