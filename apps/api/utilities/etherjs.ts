import { ethers } from "ethers";
import { CONFIG } from "./config";

const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const wallet = new ethers.Wallet(CONFIG.privateKey, provider);

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

const contract = new ethers.Contract(CONFIG.contractAddress, abi, wallet);

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