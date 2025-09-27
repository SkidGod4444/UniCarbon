import { ethers } from "ethers";
import { CONFIG, ownerSigner, provider } from "./config";

// Minimal ABIs
export const ABI_CARBON_MANAGER = [
  // events
  "event CreditsPurchased(address indexed buyer, uint256 amount, uint256 paid)",
  "event CreditsOffset(address indexed company, uint256 amount, uint256 nftId)",
  // admin functions
  "function projectComplete(uint256 amount) external",
  "function withdraw() external",
  // read
  "function pricePerCredit() view returns (uint256)"
];

export const ABI_CARBON_CREDIT = [
  "function balanceOf(address) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const ABI_OFFSET_NFT = [
  "function mintCertificate(address to, string uri) external returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

export const carbonManager = new ethers.Contract(
  CONFIG.carbonManagerAddress,
  ABI_CARBON_MANAGER,
  ownerSigner
);

export const carbonCredit = new ethers.Contract(
  CONFIG.carbonCreditAddress,
  ABI_CARBON_CREDIT,
  provider
);

export const offsetNFT = new ethers.Contract(
  CONFIG.offsetNftAddress,
  ABI_OFFSET_NFT,
  provider
);