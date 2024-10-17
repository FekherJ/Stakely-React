async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const StakingContract = await ethers.getContractFactory("Staking");
  const staking = await StakingContract.deploy();
  await staking.deployed();

  console.log("Staking contract deployed to:", staking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
