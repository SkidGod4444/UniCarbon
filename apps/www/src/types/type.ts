// Attribute structure
export interface ProjectAttribute {
  sharePerNFT: number;
  propertyType: string;
  initialSharePrice: number;
  initialPropertyValue: number;
  carbonCredits?: number;
  nftSymbol?: string;
  irr?: string;
  arr?: string;
  invested?: number;
  owners?: number;
}

// Value parameters structure
export interface ValueParameter {
  roi: number;
  rentalYield: number;
  appreciation: number;
}

// Update structure
export interface ProjectUpdate {
  id: string;
  date: string; // ISO date string
  message: string;
}

// Progress structure
export interface ProjectProgress {
  id: string;
  title: string;
  isDone: boolean;
}

// Highlight structure
export interface Highlight {
  highlight: string;
}

// User KYC structure
export interface UserKyc {
  id: string;
  status: boolean; // ✅ can be boolean, or enum if "pending/approved"
}

// Main Project interface
export default interface Project {
  id: string;
  created_at: string;
  name: string;
  description: string;
  status: string;
  price: number | null;
  available_shares: number | null;
  location: string;
  type: string;
  image: string | null;
  attributes: ProjectAttribute | null; // ✅ FIXED to single object
  value_parameters: ValueParameter[] | null;
  updates: ProjectUpdate[] | null;
  progress: ProjectProgress[] | null;
  growth: string | null;
  Project_Parameters: Record<string, unknown> | null;
  Highlights: Highlight[] | null;
  totalShares: number | null;
  Documents: string[] | null;
}
