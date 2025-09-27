import { spawn } from "child_process";
import { chainweb, network, ethers } from "hardhat";
import { Wallet } from "ethers";
import password from "@inquirer/password";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type { DeployedContractsOnChains } from "@kadena/hardhat-chainweb/lib/utils";
// import { generateDeployedContractsFile } from "./utils";
import * as dotenv from "dotenv";
dotenv.config();

// Helper function for better logging
function logContractDeployment(contractName: string, address: string, chainId?: string) {
  console.log("=".repeat(60));
  console.log(`📄 Contract: ${contractName}`);
  console.log(`📍 Address: ${address}`);
  if (chainId) {
    console.log(`⛓️  Chain ID: ${chainId}`);
  }
  console.log("=".repeat(60));
}

// Helper function to validate deployment
function validateDeployment(deployment: any, contractName: string): boolean {
  if (!deployment || !deployment.address) {
    console.error(`❌ Failed to deploy ${contractName}: No address returned`);
    return false;
  }
  if (deployment.address === "0x0000000000000000000000000000000000000000") {
    console.error(`❌ Failed to deploy ${contractName}: Invalid address (0x0)`);
    return false;
  }
  return true;
}

/**
 * Deploys using the Hardhat Kadena plugin direcftly for local. It decrypts the encrypted PK (if used)
 * and spawns a new process for remote deployment
 */
async function main() {
  let deployed: { deployments: DeployedContractsOnChains[] };
  let successfulDeployments: DeployedContractsOnChains[];
  let deployer: SignerWithAddress;
  let decryptedPrivateKey: string;

  // Make sure we're on the first chainweb chain
  const chains = await chainweb.getChainIds();
  await chainweb.switchChain(chains[0]);

  const isLocalNetwork = network.name.includes("hardhat") || network.name.includes("localhost");

  if (isLocalNetwork) {
    try {
      // LOCAL: Simple deployment with built-in Hardhat accounts
      [deployer] = await ethers.getSigners();

      console.log("🚀 Starting local deployment...");
      console.log(`👤 Deployer: ${deployer.address}`);
      console.log(`🌐 Network: ${network.name}`);
      console.log(`⛓️  Chain ID: ${chains[0]}`);
      console.log("");

      // Deploy CarbonCredit first
      console.log("📦 Deploying CarbonCredit contract...");
      const carbonCreditDeployed = await chainweb.deployContractOnChains({
        name: "CarbonCredit",
        constructorArgs: [deployer.address],
      });

      if (!validateDeployment(carbonCreditDeployed.deployments[0], "CarbonCredit")) {
        throw new Error("CarbonCredit deployment failed");
      }

      // Deploy OffsetNFT
      console.log("📦 Deploying OffsetNFT contract...");
      const offsetNFTDeployed = await chainweb.deployContractOnChains({
        name: "OffsetNFT",
        constructorArgs: [deployer.address],
      });

      if (!validateDeployment(offsetNFTDeployed.deployments[0], "OffsetNFT")) {
        throw new Error("OffsetNFT deployment failed");
      }

      // Deploy CarbonOffsetManager with dependencies
      console.log("📦 Deploying CarbonOffsetManager contract...");
      const pricePerCredit = ethers.parseUnits("1", 18); // 1 ETH per credit

      deployed = await chainweb.deployContractOnChains({
        name: "CarbonOffsetManager",
        constructorArgs: [
          carbonCreditDeployed.deployments[0].address, // _carbonCredit
          offsetNFTDeployed.deployments[0].address, // _offsetNFT
          deployer.address, // _centralWallet
          deployer.address, // initialOwner
          pricePerCredit, // _pricePerCredit
        ],
      });

      if (!validateDeployment(deployed.deployments[0], "CarbonOffsetManager")) {
        throw new Error("CarbonOffsetManager deployment failed");
      }

      // Filter out failed deployments
      successfulDeployments = deployed.deployments.filter(d => d !== null);

      if (successfulDeployments.length > 0) {
        console.log("");
        console.log("✅ All contracts deployed successfully!");
        console.log(`📊 Deployed to ${successfulDeployments.length} chain(s)`);
        console.log("");

        // Log addresses with better formatting
        const carbonCreditAddress = carbonCreditDeployed.deployments[0].address;
        const offsetNFTAddress = offsetNFTDeployed.deployments[0].address;
        const carbonOffsetManagerAddress = deployed.deployments[0].address;

        logContractDeployment("CarbonCredit", carbonCreditAddress, chains[0].toString());
        logContractDeployment("OffsetNFT", offsetNFTAddress, chains[0].toString());
        logContractDeployment("CarbonOffsetManager", carbonOffsetManagerAddress, chains[0].toString());

        console.log("");
        console.log("🔗 Contract Interaction Summary:");
        console.log(`   • CarbonCredit: ${carbonCreditAddress}`);
        console.log(`   • OffsetNFT: ${offsetNFTAddress}`);
        console.log(`   • CarbonOffsetManager: ${carbonOffsetManagerAddress}`);
        console.log(`   • Price per credit: ${ethers.formatEther(pricePerCredit)} ETH`);
        console.log(`   • Central wallet: ${deployer.address}`);
        console.log("");

        process.exit(0);
      } else {
        throw new Error("No contracts were successfully deployed");
      }
    } catch (error) {
      console.error("❌ Local deployment failed:", error);
      process.exit(1);
    }
  }

  // REMOTE: Use spawn pattern for encrypted keys
  try {
    const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
    const plainKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (encryptedKey) {
      console.log("🔐 Using encrypted private key...");
      const pass = await password({ message: "Enter password to decrypt private key:" });

      try {
        const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);
        decryptedPrivateKey = wallet.privateKey;
        console.log("✅ Private key decrypted successfully");
      } catch (e) {
        console.error("❌ Failed to decrypt private key. Wrong password?", e);
        process.exit(1);
      }
    } else if (plainKey) {
      console.log("🔑 Using plain private key from .env...");
      decryptedPrivateKey = plainKey;
    } else {
      console.error("🚫 No private key found. Set DEPLOYER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY_ENCRYPTED");
      process.exit(1);
    }

    // Spawn a new hardhat process with the decrypted key
    console.log("🚀 Spawning hardhat process for remote deployment...");

    const env = {
      ...process.env,
      __RUNTIME_DEPLOYER_PRIVATE_KEY: decryptedPrivateKey,
    };

    if (!network.name.includes("testnet")) {
      console.error(`❌ Unsupported network: ${network.name}`);
      console.error("Currently only testnet networks are supported");
      process.exit(1);
    }

    const chainwebNetwork = "testnet";
    console.log(`🌐 Using chainweb network: ${chainwebNetwork}`);
    console.log(`⛓️  Target network: ${network.name}`);

    const chainwebArgs = ["--chainweb", chainwebNetwork];

    const spawnedProcess = spawn("npx", ["hardhat", "run", "scripts/deployToRemoteChains.ts", ...chainwebArgs], {
      stdio: "inherit",
      env: env,
      cwd: process.cwd(),
    });

    spawnedProcess.on("close", code => {
      if (code === 0) {
        console.log("✅ Remote deployment completed successfully");
      } else {
        console.error(`❌ Remote deployment failed with exit code ${code}`);
        process.exit(code || 1);
      }
    });

    spawnedProcess.on("error", error => {
      console.error("❌ Failed to start remote deployment process:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Remote deployment setup failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
