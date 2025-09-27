import { ethers } from "ethers";
import { CONFIG } from "./config";

const provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl);
const wallet = new ethers.Wallet(CONFIG.privateKey, provider);

const abi = [
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "buyCredits",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "string", name: "projectName", type: "string" }
    ],
    name: "offset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "projectComplete",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const nft = new ethers.Contract(CONFIG.contractAddress, abi, wallet);

export const buyCredits = async (amount: number) => {
  try {
    const weiAmount = ethers.parseUnits(amount.toString(), 18);
    const pricePerCredit = ethers.parseUnits(CONFIG.pricePerCredit.toString(), 18);
    const totalValue = (weiAmount * pricePerCredit) / ethers.parseUnits("1", 18);
    const tx = await nft.buyCredits(weiAmount, { value: totalValue });
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Credits purchased!");
    return tx.hash;
  } catch (error) {
    console.error("Error in buyCredits:", error);
    throw error;
  }
};

export const offset = async (amount: number, projectName: string) => {
  try {
    const weiAmount = ethers.parseUnits(amount.toString(), 18);
    const tx = await nft.offset(weiAmount, projectName);
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Offset completed!");
    return tx.hash;
  } catch (error) {
    console.error("Error in offset:", error);
    throw error;
  }
};

export const completeProject = async (amount: number) => {
  try {
    const weiAmount = ethers.parseUnits(amount.toString(), 18);
    const tx = await nft.projectComplete(weiAmount);
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Project marked as complete!");
    return tx.hash;
  } catch (error) {
    console.error("Error in completeProject:", error);
    throw error;
  }
};

export const withdraw = async () => {
  try {
    const tx = await nft.withdraw();
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Withdrawal successful!");
    return tx.hash;
  } catch (error) {
    console.error("Error in withdraw:", error);
    throw error;
  }
};