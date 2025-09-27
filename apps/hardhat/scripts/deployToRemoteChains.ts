import { chainweb, ethers, run } from "hardhat";
// import { generateDeployedContractsFile } from "./utils";

async function main() {
  console.log("Remote deployment starting...");

  const verificationDelay = process.env.VERIFICATION_DELAY ? parseInt(process.env.VERIFICATION_DELAY) : 10000; // Default 10 seconds

  const chains = await chainweb.getChainIds();
  console.log("chains,", chains);
  await chainweb.switchChain(chains[0]);

  // Now the signer will be available because __RUNTIME_DEPLOYER_PRIVATE_KEY was set!
  const [deployer] = await ethers.getSigners();

  const [factoryAddress] = await chainweb.create2.deployCreate2Factory();
  console.log(`Create2 factory deployed at: ${factoryAddress}`);

  // This creates a bytes32 hash of the string. Change as needed to redeploy same contract code to different address.
  const salt = ethers.id("mySalt");

  // Deploy CarbonCredit first
  console.log("Deploying CarbonCredit using Create2...");
  const carbonCreditDeployed = await chainweb.create2.deployOnChainsUsingCreate2({
    name: "CarbonCredit",
    constructorArgs: [deployer.address],
    create2Factory: factoryAddress,
    salt: ethers.id("carbonCredit"),
  });

  // Deploy OffsetNFT
  console.log("Deploying OffsetNFT using Create2...");
  const offsetNFTDeployed = await chainweb.create2.deployOnChainsUsingCreate2({
    name: "OffsetNFT",
    constructorArgs: [deployer.address],
    create2Factory: factoryAddress,
    salt: ethers.id("offsetNFT"),
  });

  // Deploy CarbonOffsetManager with dependencies
  console.log("Deploying CarbonOffsetManager using Create2...");
  const pricePerCredit = ethers.parseUnits("1", 18); // 1 ETH per credit
  const deployed = await chainweb.create2.deployOnChainsUsingCreate2({
    name: "CarbonOffsetManager",
    constructorArgs: [
      carbonCreditDeployed.deployments[0].address, // _carbonCredit
      offsetNFTDeployed.deployments[0].address, // _offsetNFT
      deployer.address, // _centralWallet
      deployer.address, // initialOwner
      pricePerCredit, // _pricePerCredit
    ],
    create2Factory: factoryAddress,
    salt: salt,
  });

  deployed.deployments.forEach(async deployment => {
    console.log(`${deployment.address} on ${deployment.chain}`);
  });

  const successfulDeployments = deployed.deployments.filter(d => d !== null);

  if (successfulDeployments.length > 0) {
    console.log(`Contract successfully deployed to ${successfulDeployments.length} chains`);

    // Generate the deployed contracts file
    // await generateDeployedContractsFile(successfulDeployments);

    // Collect all contract deployments for verification
    const allDeployments = [
      { name: "CarbonCredit", deployments: carbonCreditDeployed.deployments, constructorArgs: [deployer.address] },
      { name: "OffsetNFT", deployments: offsetNFTDeployed.deployments, constructorArgs: [deployer.address] },
      {
        name: "CarbonOffsetManager",
        deployments: deployed.deployments,
        constructorArgs: [
          carbonCreditDeployed.deployments[0].address, // _carbonCredit
          offsetNFTDeployed.deployments[0].address, // _offsetNFT
          deployer.address, // _centralWallet
          deployer.address, // initialOwner
          pricePerCredit, // _pricePerCredit
        ],
      },
    ];

    // Verify all smart contracts on each chain
    await chainweb.runOverChains(async (chainId: number) => {
      console.log(`\n🔍 Starting verification for chain ${chainId}...`);

      for (const contract of allDeployments) {
        const deployment = contract.deployments.find(d => d && d.chain === chainId);

        if (!deployment) {
          console.log(`⚠️  No ${contract.name} deployment found for chain ${chainId}, skipping verification`);
          continue;
        }

        const contractAddress = deployment.address;
        console.log(`\n📋 Verifying ${contract.name} at ${contractAddress} on chain ${chainId}...`);

        try {
          console.log(`⏳ Waiting ${verificationDelay / 1000} seconds before verification...`);

          // Optional delay for verification API to index the contract
          if (verificationDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, verificationDelay));
          }

          console.log(`🔍 Attempting to verify ${contract.name} on chain ${chainId}...`);
          await run("verify:verify", {
            address: contractAddress,
            constructorArguments: contract.constructorArgs,
            force: true,
          });

          console.log(`✅ ${contract.name} successfully verified on chain ${chainId}`);
        } catch (verifyError: any) {
          console.error(`❌ Error verifying ${contract.name} on chain ${chainId}:`, verifyError.message);
        }
      }
    });
  }
}

main().catch(console.error);
