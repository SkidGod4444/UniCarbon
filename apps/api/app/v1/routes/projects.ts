import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "@unicarbon/db";
import type { 
  ApiResponse, 
  CreateProjectRequest, 
  Project, 
  ProjectDetails, 
  ProjectListResponse, 
  ProjectStatsResponse,
  PaginationResponse,
  NftDetails
} from "../types/api";

const projects = new Hono();

// Schema for creating a project
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address").optional()
});

// Schema for project ID validation
const projectIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid project ID");

/**
 * @route GET /projects
 * @description List all offset projects
 */
projects.get("/", async (c): Promise<Response> => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const search = c.req.query("search") || "";

  try {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } }
      ]
    } : {};

    const projects = await prisma.offsetProjects.findMany({
      where,
      include: {
        NftProofs: {
          include: {
            company: {
              select: { name: true, wallet: true }
            }
          }
        }
      },
      orderBy: { created_at: "desc" },
      take: limit,
      skip: offset
    });

    const total = await prisma.offsetProjects.count({ where });

    const projectData = projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      wallet: project.wallet,
      createdAt: project.created_at,
      nftCount: project.NftProofs?.length || 0,
      totalOffset: project.NftProofs?.reduce((sum: any, nft: any) => {
        // Extract amount from metadata if available
        const amountMatch = nft.metadata_uri.match(/"amount":"(\d+(?:\.\d+)?)"/);
        return sum + (amountMatch ? parseFloat(amountMatch[1]) : 0);
      }, 0) || 0,
      companies: [...new Set(project.NftProofs?.map((nft: any) => nft.company.name) || [])]
    }));

    const pagination: PaginationResponse = {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };

    const projectListResponse: ProjectListResponse = {
      projects: projectData,
      pagination
    };

    const response: ApiResponse<ProjectListResponse> = {
      success: true,
      data: projectListResponse
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error getting projects:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get projects" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route POST /projects
 * @description Create a new offset project
 */
projects.post("/", async (c): Promise<Response> => {
  const body: CreateProjectRequest = await c.req.json();
  const parsed = createProjectSchema.safeParse(body);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid input", 
      details: parsed.error 
    };
    return c.json(response, 400);
  }

  const { name, description, wallet } = parsed.data;

  try {
    const project = await prisma.offsetProjects.create({
      data: {
        name,
        description: description || "",
        wallet: wallet || "",
        created_at: new Date()
      }
    });

    const projectData: Project = {
      id: project.id,
      name: project.name,
      description: project.description,
      wallet: project.wallet,
      createdAt: project.created_at
    };

    const response: ApiResponse<Project> = {
      success: true,
      data: projectData
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error creating project:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to create project" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route GET /projects/:id
 * @description Get project details
 */
projects.get("/:id", async (c): Promise<Response> => {
  const projectId = c.req.param("id");
  const parsed = projectIdSchema.safeParse(projectId);
  
  if (!parsed.success) {
    const response: ApiResponse = { 
      success: false, 
      error: "Invalid project ID" 
    };
    return c.json(response, 400);
  }

  try {
    const project = await prisma.offsetProjects.findUnique({
      where: { id: projectId },
      include: {
        NftProofs: {
          include: {
            company: {
              select: { name: true, wallet: true }
            }
          },
          orderBy: { created_at: "desc" }
        }
      }
    });

    if (!project) {
      const response: ApiResponse = { 
        success: false, 
        error: "Project not found" 
      };
      return c.json(response, 404);
    }

    const nftData: NftDetails[] = project.NftProofs?.map((nft: any) => {
      const nftId = nft.metadata_uri.match(/"nftId":(\d+)/)?.[1] || "0";
      const amountMatch = nft.metadata_uri.match(/"amount":"(\d+(?:\.\d+)?)"/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      return {
        id: nft.id,
        nftId: nftId,
        company: {
          name: nft.company.name,
          wallet: nft.company.wallet
        },
        metadata: nft.metadata_uri as any,
        amount: amount,
        projectName: "",
        txHash: "",
        createdAt: nft.created_at
      };
    }) || [];

    const totalOffset = nftData.reduce((sum, nft) => sum + nft.amount, 0);
    const uniqueCompanies = [...new Set(nftData.map(nft => nft.company.name))];

    const projectDetails: ProjectDetails = {
      id: project.id,
      name: project.name,
      description: project.description,
      wallet: project.wallet,
      createdAt: project.created_at,
      stats: {
        totalNfts: nftData.length,
        totalOffset: totalOffset,
        uniqueCompanies: uniqueCompanies.length,
        companies: uniqueCompanies
      },
      nfts: nftData
    };

    const response: ApiResponse<ProjectDetails> = {
      success: true,
      data: projectDetails
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error getting project:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get project" 
    };
    return c.json(response, 500);
  }
});

/**
 * @route GET /projects/stats
 * @description Get overall project statistics
 */
projects.get("/stats", async (c): Promise<Response> => {
  try {
    const [
      totalProjects,
      totalNfts,
      totalOffset,
      projectsWithActivity
    ] = await Promise.all([
      prisma.offsetProjects.count(),
      prisma.nftProofs.count(),
      prisma.nftProofs.findMany({
        select: { metadata_uri: true }
      }).then((nfts: any) => 
        nfts.reduce((sum: any, nft: any) => {
          const amountMatch = nft.metadata_uri.match(/"amount":"(\d+(?:\.\d+)?)"/);
          return sum + (amountMatch ? parseFloat(amountMatch[1]) : 0);
        }, 0)
      ),
      prisma.offsetProjects.count({
        where: {
          NftProofs: {
            some: {}
          }
        }
      })
    ]);

    const projectStats: ProjectStatsResponse = {
      totalProjects,
      totalNfts,
      totalOffset,
      projectsWithActivity,
      averageNftsPerProject: totalProjects > 0 ? (totalNfts / totalProjects).toFixed(2) : "0"
    };

    const response: ApiResponse<ProjectStatsResponse> = {
      success: true,
      data: projectStats
    };
    return c.json(response);

  } catch (err: any) {
    console.error("Error getting project stats:", err);
    const response: ApiResponse = { 
      success: false, 
      error: err?.message ?? "Failed to get project stats" 
    };
    return c.json(response, 500);
  }
});

export default projects;
