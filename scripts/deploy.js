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
  console.log('Deploying RWD...');
  const rewardToken = await ERC20Mock.deploy("Reward Token", "RWD");
  await rewardToken.waitForDeployment();

  console.log("Staking Token deployed to:", await stakingToken.getAddress());
  console.log("Reward Token deployed to:", await rewardToken.getAddress());

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

  // *** Approve the staking contract to spend reward tokens ***
  const notifyRewardAmount = ethers.parseUnits("100", 18); // Example reward amount to notify
  await rewardToken.approve(stakingContract.getAddress(), notifyRewardAmount);  // This line is crucial
  console.log(`Approved staking contract to spend ${ethers.formatUnits(notifyRewardAmount, 18)} RWD`);

  // *** Verify that the allowance is correctly set ***
  let allowance = await rewardToken.allowance(deployer.address, stakingContract.getAddress());

  

  // If allowance is BigInt, handle it as such without conversion
  if (typeof allowance === 'bigint') {
    //console.log("Allowance is a BigInt, treating it directly as BigInt.");
  } else if (typeof allowance === 'string' || typeof allowance === 'number') {
    // If it's not a BigInt, convert it to a BigNumber
    allowance = ethers.BigNumber.from(allowance.toString());
  } else {
    console.error("Unknown allowance type:", typeof allowance);
    return;
  }

  console.log(`Allowance for staking contract: ${ethers.formatUnits(allowance, 18)} RWD`);

  // *** Directly Compare the Allowance ***
  if (allowance < notifyRewardAmount) {  // If allowance is less than the notifyRewardAmount
    console.error("Insufficient allowance for staking contract to transfer reward tokens.");
  } else {
    const tx = await stakingContract.notifyRewardAmount(notifyRewardAmount);
    await tx.wait();
    console.log(`Notified the staking contract of ${ethers.formatUnits(notifyRewardAmount, 18)} RWD as rewards.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });