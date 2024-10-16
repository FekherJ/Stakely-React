const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract", function () {
  let staking, stakingToken, rewardToken, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("ERC20");
    stakingToken = await Token.deploy("Staking Token", "STK");
    rewardToken = await Token.deploy("Reward Token", "RWD");

    const Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(stakingToken.address, rewardToken.address);
  });

  it("Should stake tokens and update balances", async function () {
    await stakingToken.mint(addr1.address, 1000);
    await stakingToken.connect(addr1).approve(staking.address, 1000);
    await staking.connect(addr1).stake(1000);

    expect(await staking.balances(addr1.address)).to.equal(1000);
  });

  it("Should calculate rewards correctly", async function () {
    // Add more complex test logic here
  });
});
