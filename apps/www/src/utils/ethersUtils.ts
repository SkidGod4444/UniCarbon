import { ethers } from "ethers";

const INFURA_API_URL = import.meta.env.VITE_INFURA_API_URL;
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY;
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

if (!INFURA_API_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error("Missing environment variables. Check your .env file.");
}

// Connect to Ethereum provider
const provider = new ethers.JsonRpcProvider(INFURA_API_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const abi = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "sourceCompany", type: "address" },
      { internalType: "address", name: "sinkCompany", type: "address" },
      { internalType: "string", name: "fromProject", type: "string" },
    ],
    name: "offsetAgainstProject",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "projectName", type: "string" },
    ],
    name: "projectComplete",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Create Contract Instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

export const offsetAgainstProject = async (
  amount: number,
  sourceCompany: string,
  sinkCompany: string,
  fromProject: string
) => {
  try {
    const weiAmount = ethers.parseEther(amount.toString());
    const tx = await contract.offsetAgainstProject(
      weiAmount,
      sourceCompany,
      sinkCompany,
      fromProject
    );
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Transaction confirmed!");
    return tx.hash;
  } catch (error) {
    console.error("Error in offsetAgainstProject:", error);
    throw error;
  }
};

export const completeProject = async (amount: number, projectName: string) => {
  try {
    const weiAmount = ethers.parseEther(amount.toString());
    const tx = await contract.projectComplete(weiAmount, projectName);
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Project marked as complete!");
    return tx.hash;
  } catch (error) {
    console.error("Error in completeProject:", error);
    throw error;
  }
};
