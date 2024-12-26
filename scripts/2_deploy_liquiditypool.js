// deploy-liquiditypool.js - Updated Hardhat deployment script for Liquidity Pool

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Fetch Staking and Reward token addresses dynamically
  const stakingTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace dynamically if needed
  const rewardTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Replace dynamically if needed

  console.log("Using existing Staking Token Address:", stakingTokenAddress);
  console.log("Using existing Reward Token Address:", rewardTokenAddress);

  // Deploy Liquidity Pool contract
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(stakingTokenAddress, rewardTokenAddress);
  await liquidityPool.waitForDeployment();

  const liquidityPoolAddress = await liquidityPool.getAddress();
  console.log("Liquidity Pool Contract deployed to:", liquidityPoolAddress);

  // Verify contract addresses to avoid address conflicts
  console.log(`Staking Token Address: ${stakingTokenAddress}`);
  console.log(`Reward Token Address: ${rewardTokenAddress}`);
  console.log(`Liquidity Pool Address: ${liquidityPoolAddress}`);

  // Get instance of deployed staking token with explicit ABI
  const stakingToken = await ethers.getContractAt("ERC20Mock", stakingTokenAddress);

  // Verify contract interface and mint function
  console.log("Verifying contract interface...");
  const contractCode = await ethers.provider.getCode(stakingTokenAddress);
  if (contractCode === "0x") {
    throw new Error(`No contract deployed at ${stakingTokenAddress}`);
  }

  const expectedMintSelector = "0x40c10f19"; // Keccak selector for mint(address,uint256)
  const stakingTokenInterface = stakingToken.interface.fragments.map(f => f.selector);
  if (!stakingTokenInterface.includes(expectedMintSelector)) {
    throw new Error("Contract does not support the mint function!");
  }

  console.log("Mint function verified, proceeding...");

  // Mint tokens for testing
  const mintAmount = ethers.parseUnits("1000", 18);
  await stakingToken.mint(deployer.address, mintAmount);
  console.log(`Minted ${ethers.formatUnits(mintAmount, 18)} STK to ${deployer.address}`);

  // Approve Liquidity Pool contract to spend deployer's tokens
  const approveAmount = ethers.parseUnits("500", 18);
  await stakingToken.approve(liquidityPoolAddress, approveAmount);
  console.log(`Approved ${ethers.formatUnits(approveAmount, 18)} STK for Liquidity Pool contract`);

  console.log("Liquidity Pool deployment and setup completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment Error:", error);
    process.exit(1);
  });
