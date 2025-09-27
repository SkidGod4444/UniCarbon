import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@unicarbon/db";
import { offsetNFT } from "../../../utilities/contracts";
import type { 
  ApiResponse, 
  NftDetails, 
  NftListResponse, 
  AllNftsResponse, 
  NftMetadata,
  PaginationResponse 
} from "../types/api";

const nfts = new Hono();

// Schema for wallet validation
const walletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address");

// Schema for NFT ID validation
const nftIdSchema = z.string().regex(/^\d+$/, "NFT ID must be a number");

/**
 * @route GET /nfts/:companyWallet
 * @description List all NFT proofs owned by the company
 */
nfts.get("/:companyWallet", async (c): Promise<Response> => {
  const companyWallet = c.req.param("companyWallet");
  const parsed = walletSchema.safeParse(companyWallet);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid wallet address" 
    };
    return c.json(response, 400);
  }

  try {
    // Find company
    const company = await prisma.companies.findUnique({
      where: { wallet: companyWallet.toLowerCase() }
    });

    if (!company) {
      const response: ApiResponse = { 
        success: false, 
        error: "Company not found" 
      };
      return c.json(response, 404);
    }

    // Get all NFT proofs for the company
    const nftProofs = await prisma.nftProofs.findMany({
      where: { company_id: company.id },
      include: {
        company: {
          select: { name: true, wallet: true }
        }
      },
      orderBy: { created_at: "desc" }
    });

    // Get corresponding credit records for additional context
    const nftData: NftDetails[] = await Promise.all(
      nftProofs.map(async (nft: any) => {
        const creditRecord = await prisma.carbonCredits.findFirst({
          where: {
            company_id: company.id,
            nft_id: parseInt(nft.metadata_uri.match(/"nftId":(\d+)/)?.[1] || "0"),
            type: "offset"
          }
        });

        return {
          id: nft.id,
          nftId: nft.metadata_uri.match(/"nftId":(\d+)/)?.[1] || "0",
          company: {
            name: nft.company.name,
            wallet: nft.company.wallet
          },
          metadata: nft.metadata_uri as any, // Will be parsed later
          amount: creditRecord?.amount || 0,
          projectName: creditRecord?.project_name || "",
          txHash: creditRecord?.tx_hash || "",
          createdAt: nft.created_at
        };
      })
    );

    const nftListResponse: NftListResponse = {
      company: {
        name: company.name,
        wallet: company.wallet
      },
      nfts: nftData,
      total: nftData.length
    };

    const response: ApiResponse<NftListResponse> = {
      success: true,
      data: nftListResponse
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error getting NFTs:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get NFTs" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route GET /nft/:nftId
 * @description Get metadata of a specific NFT (from OffsetNFT.tokenURI)
 */
nfts.get("/:nftId", async (c): Promise<Response> => {
  const nftId = c.req.param("nftId");
  const parsed = nftIdSchema.safeParse(nftId);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid NFT ID" 
    };
    return c.json(response, 400);
  }

  try {
    // Get token URI from the contract
    const tokenURI = await offsetNFT.tokenURI(parseInt(nftId));
    
    // Parse the metadata (it's stored as JSON string in the contract)
    let metadata: NftMetadata | { raw: string };
    try {
      metadata = JSON.parse(tokenURI) as NftMetadata;
    } catch {
      // If parsing fails, return the raw string
      metadata = { raw: tokenURI };
    }

    // Get additional info from database if available
    const nftProof = await prisma.nftProofs.findFirst({
      where: {
        metadata_uri: {
          contains: `"nftId":${nftId}`
        }
      },
      include: {
        company: {
          select: { name: true, wallet: true }
        }
      }
    });

    const nftDetails: NftDetails = {
      id: nftProof?.id || "",
      nftId: nftId,
      company: nftProof?.company || { name: "", wallet: "" },
      metadata: metadata,
      amount: 0, // Will be filled from credit record if needed
      projectName: "",
      txHash: "",
      createdAt: nftProof?.created_at || new Date(),
      databaseInfo: nftProof ? {
        id: nftProof.id,
        company: {
          name: nftProof.company.name,
          wallet: nftProof.company.wallet
        },
        createdAt: nftProof.created_at
      } : undefined
    };

    const response: ApiResponse<NftDetails> = {
      success: true,
      data: nftDetails
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error getting NFT metadata:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get NFT metadata" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route GET /nfts
 * @description Get all NFTs across all companies (for admin/audit purposes)
 */
nfts.get("/", async (c): Promise<Response> => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  try {
    const nftProofs = await prisma.nftProofs.findMany({
      include: {
        company: {
          select: { name: true, wallet: true }
        }
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset
    });

    const total = await prisma.nftProofs.count();

    const nftData: NftDetails[] = await Promise.all(
      nftProofs.map(async (nft: any) => {
        const nftId = nft.metadata_uri.match(/"nftId":(\d+)/)?.[1] || "0";
        const creditRecord = await prisma.carbonCredits.findFirst({
          where: {
            company_id: nft.company_id,
            nft_id: parseInt(nftId),
            type: "offset"
          }
        });

        return {
          id: nft.id,
          nftId: nftId,
          company: {
            name: nft.company.name,
            wallet: nft.company.wallet
          },
          metadata: nft.metadata_uri as any,
          amount: creditRecord?.amount || 0,
          projectName: creditRecord?.project_name || "",
          txHash: creditRecord?.tx_hash || "",
          createdAt: nft.created_at
        };
      })
    );

    const pagination: PaginationResponse = {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };

    const allNftsResponse: AllNftsResponse = {
      nfts: nftData,
      pagination
    };

    const response: ApiResponse<AllNftsResponse> = {
      success: true,
      data: allNftsResponse
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error getting all NFTs:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get NFTs" 
    };
    return c.json(response, 500);
  }
});

export default nfts;
