import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@unicarbon/db";
import { carbonCredit, carbonManager } from "../../../utilities/contracts";
import type { 
  ApiResponse, 
  CreateCompanyRequest, 
  Company, 
  CompanyDetails, 
  CreditOperationRequest, 
  BuyCreditsResponse, 
  OffsetCreditsResponse,
  PrismaCompany 
} from "../types/api";
import { CONFIG } from "@/utilities/config";

const company = new Hono();

// Schema for company registration
const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address")
});

// Schema for credit operations
const creditOperationSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  projectName: z.string().min(1, "Project name is required").optional()
});

/**
 * @route POST /company
 * @description Register a new company in the DB
 */
company.post("/", async (c): Promise<Response> => {
  const body: CreateCompanyRequest = await c.req.json();
  const parsed = createCompanySchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  const { name, wallet } = parsed.data;

  try {
    // Check if company already exists
    const existingCompany = await prisma.companies.findUnique({
      where: { wallet: wallet.toLowerCase() }
    });

    if (existingCompany) {
      const response: ApiResponse = { 
        success: false, 
        error: "Company with this wallet already exists" 
      };
      return c.json(response, 409);
    }

    const newCompany = await prisma.companies.create({
      data: {
        name,
        wallet: wallet.toLowerCase(),
        total_purchased: 0,
        total_offset: 0,
        created_at: new Date()
      }
    });

    const companyData: Company = {
      id: newCompany.id,
      name: newCompany.name,
      wallet: newCompany.wallet,
      totalPurchased: newCompany.total_purchased || 0,
      totalOffset: newCompany.total_offset || 0,
      createdAt: newCompany.created_at
    };

    const response: ApiResponse<Company> = {
      success: true,
      data: companyData
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error creating company:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to create company" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route GET /company/:wallet
 * @description Get company details including totalPurchased, totalOffset, credits, NFTs
 */
company.get("/:wallet", async (c): Promise<Response> => {
  const wallet = c.req.param("wallet").toLowerCase();

  try {
    const company: PrismaCompany | null = await prisma.companies.findUnique({
      where: { wallet },
      include: {
        CarbonCredits: {
          orderBy: { created_at: "desc" }
        },
        NftProofs: {
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!company) {
      const response: ApiResponse = { 
        success: false, 
        error: "Company not found" 
      };
      return c.json(response, 404);
    }

    // Get current credit balance from blockchain
    const currentBalance = await carbonCredit.balanceOf(wallet);

    const companyDetails: CompanyDetails = {
      id: company.id,
      name: company.name,
      wallet: company.wallet,
      totalPurchased: company.total_purchased || 0,
      totalOffset: company.total_offset || 0,
      currentBalance: currentBalance.toString(),
      createdAt: company.created_at,
      credits: company.CarbonCredits?.map((credit: any) => ({
        id: credit.id,
        amount: credit.amount,
        type: credit.type as 'purchase' | 'offset',
        projectName: credit.project_name,
        txHash: credit.tx_hash,
        nftId: credit.nft_id,
        createdAt: credit.created_at
      })) || [],
      nfts: company.NftProofs?.map((nft: any) => ({
        id: nft.id,
        metadataUri: nft.metadata_uri,
        createdAt: nft.created_at
      })) || []
    };

    const response: ApiResponse<CompanyDetails> = {
      success: true,
      data: companyDetails
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error getting company:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get company" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route POST /credits/buy
 * @description Initiates a purchase of CarbonCredits (returns transaction data for frontend)
 */
company.post("/credits/buy", async (c): Promise<Response> => {
  const body: CreditOperationRequest = await c.req.json();
  const parsed = creditOperationSchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  const { amount } = parsed.data;

  try {
    // Get contract addresses and ABI for frontend
    const carbonManagerAddress = process.env.CARBON_MANAGER_ADDRESS;
    const pricePerCredit = await carbonManager.pricePerCredit();
    const totalCost = amount * Number(pricePerCredit);

    const buyResponse: BuyCreditsResponse = {
      transaction: {
        contractAddress: carbonManagerAddress || "",
        functionName: "buyCredits",
        functionArgs: [amount],
        value: totalCost.toString(),
        gasEstimate: "200000", // Estimated gas for the transaction
        message: "Call this function on the CarbonOffsetManager contract with the specified parameters"
      },
      details: {
        amount,
        pricePerCredit: pricePerCredit.toString(),
        totalCost: totalCost.toString(),
        totalCostEth: (totalCost / 1e18).toFixed(6)
      }
    };

    const response: ApiResponse<BuyCreditsResponse> = {
      success: true,
      data: buyResponse
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error preparing buy transaction:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to prepare buy transaction" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route POST /credits/offset
 * @description Initiates offsetting credits for a project (returns transaction data for frontend)
 */
company.post("/credits/offset", async (c): Promise<Response> => {
  const body: CreditOperationRequest = await c.req.json();
  const parsed = creditOperationSchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  const { amount, projectName } = parsed.data;

  if (!projectName) {
    const response: ApiResponse = { 
      success: false, 
      error: "Project name is required for offsetting" 
    };
    return c.json(response, 400);
  }

  try {
    const carbonManagerAddress = CONFIG.carbonManagerAddress;

    const offsetResponse: OffsetCreditsResponse = {
      transaction: {
        contractAddress: carbonManagerAddress || "",
        functionName: "offset",
        functionArgs: [amount, projectName],
        value: "0", // No ETH required for offsetting
        gasEstimate: "300000", // Estimated gas for the transaction
        message: "Call this function on the CarbonOffsetManager contract with the specified parameters"
      },
      details: {
        amount,
        projectName,
        message: "This will burn your credits and mint an NFT certificate"
      }
    };

    const response: ApiResponse<OffsetCreditsResponse> = {
      success: true,
      data: offsetResponse
    };
    return c.json(response);
  } catch (err: any) {
    console.error("Error preparing offset transaction:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to prepare offset transaction" 
    };
    return c.json(response, 500);
  }
});

export default company;
