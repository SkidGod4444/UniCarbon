import { ethers } from "ethers";

export const CONFIG = {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
    razorpaySecret: process.env.RAZORPAY_SECRET ?? "",
    supabaseUri: process.env.SUPABASE_URI ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    rpcUrl: process.env.KADENA_RPC_URL ?? "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc",
    privateKey: process.env.DEPLOYER_PRIVATE_KEY ?? "",
    contractAddress: process.env.DEPLOYED_CONTRACT_ADDRESS ?? "",
    companyAddress: process.env.COMPANY_ADDRESS ?? "",
  };

// Validate required blockchain configuration
if (!CONFIG.rpcUrl) {
  throw new Error("KADENA_RPC_URL environment variable is required!");
}

if (!CONFIG.privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY environment variable is required!");
}

if (!CONFIG.contractAddress) {
  throw new Error("DEPLOYED_CONTRACT_ADDRESS environment variable is required!");
}

// Create provider with proper configuration
const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl, {
  name: "kadena-testnet",
  chainId: 20, // Kadena testnet chain ID
});

const ownerSigner = new ethers.Wallet(CONFIG.privateKey, provider);

export { provider, ownerSigner };