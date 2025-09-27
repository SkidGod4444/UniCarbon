
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
  };
