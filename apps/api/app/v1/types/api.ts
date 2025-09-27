// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  message?: string;
}

// Admin Types
export interface ProjectCompleteRequest {
  amount: string;
}

export interface ProjectCompleteResponse {
  txHash: string;
  amount: string;
  message: string;
}

export interface PriceResponse {
  pricePerCredit: string;
  pricePerCreditWei: string;
  pricePerCreditEth: string;
}

export interface BalanceResponse {
  centralWallet: string;
  creditBalance: string;
  ethBalance: string;
  ethBalanceEth: string;
}

// Company Types
export interface CreateCompanyRequest {
  name: string;
  wallet: string;
}

export interface Company {
  id: string;
  name: string;
  wallet: string;
  totalPurchased: number;
  totalOffset: number;
  createdAt: Date;
}

export interface CreditRecord {
  id: string;
  amount: number;
  type: 'purchase' | 'offset';
  projectName: string;
  txHash: string;
  nftId: number;
  createdAt: Date;
}

export interface NftProof {
  id: string;
  metadataUri: string;
  createdAt: Date;
}

export interface CompanyDetails extends Company {
  currentBalance: string;
  credits: CreditRecord[];
  nfts: NftProof[];
}

export interface CreditOperationRequest {
  amount: number;
  projectName?: string;
}

export interface TransactionData {
  contractAddress: string;
  functionName: string;
  functionArgs: any[];
  value: string;
  gasEstimate: string;
  message: string;
}

export interface BuyCreditsResponse {
  transaction: TransactionData;
  details: {
    amount: number;
    pricePerCredit: string;
    totalCost: string;
    totalCostEth: string;
  };
}

export interface OffsetCreditsResponse {
  transaction: TransactionData;
  details: {
    amount: number;
    projectName: string;
    message: string;
  };
}

// Transaction Types
export interface VerifyTxRequest {
  txHash: string;
}

export interface ProcessedEvent {
  type: 'purchase' | 'offset';
  buyer?: string;
  company?: string;
  amount: string;
  paid?: string;
  nftId?: number;
  creditRecordId: string;
}

export interface VerifyTxResponse {
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  eventsProcessed: number;
  events: ProcessedEvent[];
  message: string;
}

// NFT Types
export interface NftMetadata {
  nftId: string;
  amount: string;
  company: string;
  project: string;
  timestamp: string;
}

export interface NftDetails {
  id: string;
  nftId: string;
  company: {
    name: string;
    wallet: string;
  };
  metadata: NftMetadata | { raw: string };
  amount: number;
  projectName: string;
  txHash: string;
  createdAt: Date;
  databaseInfo?: {
    id: string;
    company: {
      name: string;
      wallet: string;
    };
    createdAt: Date;
  };
}

export interface NftListResponse {
  company: {
    name: string;
    wallet: string;
  };
  nfts: NftDetails[];
  total: number;
}

export interface AllNftsResponse {
  nfts: NftDetails[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Project Types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  wallet?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  wallet: string;
  createdAt: Date;
}

export interface ProjectStats {
  totalNfts: number;
  totalOffset: number;
  uniqueCompanies: number;
  companies: string[];
}

export interface ProjectDetails extends Project {
  stats: ProjectStats;
  nfts: NftDetails[];
}

export interface ProjectListResponse {
  projects: Array<Project & {
    nftCount: number;
    totalOffset: number;
    companies: string[];
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ProjectStatsResponse {
  totalProjects: number;
  totalNfts: number;
  totalOffset: number;
  projectsWithActivity: number;
  averageNftsPerProject: string;
}

// Database Types (matching Prisma schema)
export interface PrismaCompany {
  id: string;
  name: string;
  wallet: string;
  total_purchased: number | null;
  total_offset: number | null;
  created_at: Date;
  CarbonCredits?: PrismaCreditRecord[];
  NftProofs?: PrismaNftProof[];
}

export interface PrismaCreditRecord {
  id: string;
  company_id: string;
  amount: number;
  type: string;
  tx_hash: string;
  nft_id: number;
  project_name: string;
  created_at: Date;
}

export interface PrismaNftProof {
  id: string;
  company_id: string;
  offset_id: string;
  metadata_uri: string;
  created_at: Date;
}

export interface PrismaOffsetProject {
  id: string;
  name: string;
  description: string;
  wallet: string;
  created_at: Date;
  NftProofs?: PrismaNftProof[];
}

// Pagination Types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  details?: ValidationError[];
}
