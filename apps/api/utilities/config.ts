import { ethers } from "ethers";

export const CONFIG = {
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
    razorpaySecret: process.env.RAZORPAY_SECRET ?? "",
    supabaseUri: process.env.SUPABASE_URI ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    rpcUrl: process.env.KADENA_RPC_URL ?? "",
    privateKey: process.env.DEPLOYER_PRIVATE_KEY ?? "",
    contractAddress: process.env.DEPLOYED_CONTRACT_ADDRESS ?? "",
    companyAddress: process.env.COMPANY_ADDRESS ?? "",
    polarAccessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
    pricePerCredit: 1, // in USD
    carbonCreditAddress: process.env.CARBON_CREDIT_ADDRESS ?? "",
    offsetNftAddress: process.env.OFFSET_NFT_ADDRESS ?? "",
    carbonManagerAddress: process.env.CARBON_MANAGER_ADDRESS ?? "",
  };

const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const ownerSigner = new ethers.Wallet(CONFIG.privateKey, provider);

export { provider, ownerSigner };