const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("Liquidity Pool Contract", function () {
    let liquidityPool, stakingToken, owner, user1, user2;

    beforeEach(async function () {
        // Deploy the ERC20 staking token
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        stakingToken = await ERC20Mock.deploy("Staking Token", "STK");
        await stakingToken.waitForDeployment(); // Ensure staking token is deployed

        const stakingTokenAddress = stakingToken.target;  // Use `target` in ethers v6
        console.log("Staking Token Address: ", stakingTokenAddress);  // Log staking token address

        // Mint tokens to users
        [owner, user1, user2] = await ethers.getSigners();
        await stakingToken.mint(owner.address, ethers.parseEther("1000"));
        await stakingToken.mint(user1.address, ethers.parseEther("1000"));
        await stakingToken.mint(user2.address, ethers.parseEther("1000"));

        // Deploy Liquidity Pool contract
        const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        liquidityPool = await LiquidityPool.deploy(stakingTokenAddress); // Use the correct token address
        await liquidityPool.waitForDeployment(); // Ensure liquidity pool is deployed

        const liquidityPoolAddress = liquidityPool.target;  // Use `target` in ethers v6
        console.log("Liquidity Pool Address: ", liquidityPoolAddress);  // Log liquidity pool address
    });

    it("Should allow users to deposit liquidity", async function () {
        const ethAmount = ethers.parseEther("1");
        const stkAmount = ethers.parseEther("100"); // Adjust for 1 ETH = 100 STK

        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmount);  // Use `target` in ethers v6
        await liquidityPool.connect(user1).depositLiquidity(ethAmount, stkAmount, { value: ethAmount });

        const userLiquidity = await liquidityPool.userLiquidity(user1.address);
        expect(userLiquidity).to.equal(ethAmount);
    });

    it("Should update total liquidity after deposits", async function () {
        const ethAmount = ethers.parseEther("1");
        const stkAmount = ethers.parseEther("100"); // Adjust for 1 ETH = 100 STK

        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmount);
        await liquidityPool.connect(user1).depositLiquidity(ethAmount, stkAmount, { value: ethAmount });

        const totalLiquidityETH = await liquidityPool.totalLiquidityETH();
        const totalLiquiditySTK = await liquidityPool.totalLiquiditySTK();
        expect(totalLiquidityETH).to.equal(ethAmount);
        expect(totalLiquiditySTK).to.equal(stkAmount);
    });

    it("Should allow multiple users to deposit liquidity independently", async function () {
        const ethAmountUser1 = ethers.parseEther("1");
        const stkAmountUser1 = ethers.parseEther("100"); // 1 ETH = 100 STK for user1
        const ethAmountUser2 = ethers.parseEther("2");
        const stkAmountUser2 = ethers.parseEther("200"); // 2 ETH = 200 STK for user2

        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmountUser1);
        await liquidityPool.connect(user1).depositLiquidity(ethAmountUser1, stkAmountUser1, { value: ethAmountUser1 });

        await stakingToken.connect(user2).approve(liquidityPool.target, stkAmountUser2);
        await liquidityPool.connect(user2).depositLiquidity(ethAmountUser2, stkAmountUser2, { value: ethAmountUser2 });

        const totalLiquidityETH = await liquidityPool.totalLiquidityETH();
        expect(totalLiquidityETH).to.equal(ethers.parseEther("3"));

        const user1Liquidity = await liquidityPool.userLiquidity(user1.address);
        expect(user1Liquidity).to.equal(ethAmountUser1);

        const user2Liquidity = await liquidityPool.userLiquidity(user2.address);
        expect(user2Liquidity).to.equal(ethAmountUser2);
    });

    it("Should prevent deposits if ETH/STK pair is not equal in value", async function () {
        const ethAmount = ethers.parseEther("1");
        const stkAmountIncorrect = ethers.parseEther("200"); // Deliberately incorrect value (should be 100)

        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmountIncorrect);
        await expect(
            liquidityPool.connect(user1).depositLiquidity(ethAmount, stkAmountIncorrect, { value: ethAmount })
        ).to.be.revertedWith("Tokens must be deposited in the correct proportion");
    });

    it("Should allow users to withdraw full liquidity", async function () {
        const ethAmount = ethers.parseEther("1");
        const stkAmount = ethers.parseEther("100");
    
        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmount);
        await liquidityPool.connect(user1).depositLiquidity(ethAmount, stkAmount, { value: ethAmount });
    
        // Withdraw full liquidity
        await liquidityPool.connect(user1).withdrawLiquidity(ethAmount);
    
        const userLiquidity = await liquidityPool.userLiquidity(user1.address);
        expect(userLiquidity).to.equal(ethers.parseEther("0"));  // Ensure liquidity is zero after full withdrawal
    });
    

    it("Should allow users to withdraw partial liquidity", async function () {
        const ethAmount = ethers.parseEther("2");
        const stkAmount = ethers.parseEther("200");
    
        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmount);
        await liquidityPool.connect(user1).depositLiquidity(ethAmount, stkAmount, { value: ethAmount });
    
        // Withdraw half liquidity
        await liquidityPool.connect(user1).withdrawLiquidity(ethers.parseEther("1"));  // Withdrawing half the amount
    
        const userLiquidity = await liquidityPool.userLiquidity(user1.address);
        expect(userLiquidity).to.equal(ethers.parseEther("1"));  // Half of the liquidity remains
    });

    it("Should distribute rewards based on LP tokens", async function () {
        const ethAmount = ethers.parseEther("1");
        const stkAmount = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(liquidityPool.target, stkAmount);
        await liquidityPool.connect(user1).depositLiquidity(ethAmount, stkAmount, { value: ethAmount });

        // Approve liquidity pool contract to spend reward tokens
        const rewardAmount = ethers.parseEther("10");
        await stakingToken.connect(owner).approve(liquidityPool.target, rewardAmount);

        // Add rewards to the pool
        await liquidityPool.addRewards(rewardAmount);

        // Simulate reward distribution
        await liquidityPool.distributeRewards();

        const rewards = await liquidityPool.userRewards(user1.address);
        expect(rewards).to.be.above(ethers.parseEther("0"));
    });
});
