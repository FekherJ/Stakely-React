async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Using Alchemy URL:", process.env.ALCHEMY_URL);
  console.log("Using Private Key:", process.env.PRIVATE_KEY);

  
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy ERC20 token contracts for staking and reward tokens
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  

  // Deploy the staking token (STK)
  console.log('Deploying STK...');
  const stakingToken = await ERC20Mock.deploy("Staking Token", "STK");
  await stakingToken.waitForDeployment();

  // Deploy the reward token (RWD)
  const rewardToken = await ERC20Mock.deploy("Reward Token", "RWD");
  await rewardToken.waitForDeployment();



  if (!stakingToken.getAddress()) {
    console.error("Staking token deployment failed.");
  } else {
    console.log("Staking Token deployed to:", await stakingToken.getAddress());
  }
  
  if (!rewardToken.getAddress()) {
    console.error("Reward token deployment failed.");
  } else {
    console.log("Reward Token deployed to:", await rewardToken.getAddress());
  }
  

  // Deploy the staking contract with stakingToken and rewardToken addresses
  const Staking = await ethers.getContractFactory("Staking");
  const stakingContract = await Staking.deploy(stakingToken.getAddress(), rewardToken.getAddress());
  await stakingContract.waitForDeployment();
  console.log("Staking Contract deployed to:", await stakingContract.getAddress());

  // Optionally, mint some tokens for testing purposes
  const mintAmount = ethers.parseUnits("1000", 18);
  
  // Mint staking tokens for the deployer
  await stakingToken.mint(deployer.address, mintAmount);
  console.log(`Minted ${ethers.formatUnits(mintAmount, 18)} STK to ${deployer.address}`);
  
  // Mint reward tokens for the deployer
  await rewardToken.mint(deployer.address, mintAmount);
  console.log(`Minted ${ethers.formatUnits(mintAmount, 18)} RWD to ${deployer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
