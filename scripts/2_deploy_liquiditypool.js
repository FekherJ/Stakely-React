// deploy-liquiditypool.js - Hardhat deployment script for Liquidity Pool

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Ensure this address is correct from your previous deployments
  const stakingTokenAddress = "0xf4B146FbA71F41E0592668ffbF264F1D186b2Ca8"; // Replace with actual address
  console.log("Using existing Staking Token Address:", stakingTokenAddress);
  
  // Deploy Liquidity Pool contract with stakingToken address
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(stakingTokenAddress);
  await liquidityPool.waitForDeployment();
  console.log("Liquidity Pool Contract deployed to:", await liquidityPool.getAddress());

  // Get an instance of the already deployed staking token
  const stakingToken = await ethers.getContractAt("ERC20Mock", stakingTokenAddress);

  // Check if the staking token has a mint function
  if (typeof stakingToken.mint === 'function') {
    const mintAmount = ethers.parseUnits("1000", 18);

    // Mint staking tokens for the deployer (testing purpose)
    await stakingToken.mint(deployer.address, mintAmount);
    console.log(`Minted ${ethers.formatUnits(mintAmount, 18)} STK to ${deployer.address}`);
  } else {
    console.log("Mint function not available on staking token contract, skipping minting.");
  }

  // Approve the Liquidity Pool contract to spend deployer's tokens
  const approveAmount = ethers.parseUnits("500", 18);
  await stakingToken.approve(await liquidityPool.getAddress(), approveAmount);
  console.log(`Approved ${ethers.formatUnits(approveAmount, 18)} STK for Liquidity Pool contract`);

  console.log("Liquidity Pool deployment and setup completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
