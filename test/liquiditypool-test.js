const { expect } = require("chai");
const { ethers } = require("hardhat");
require("@nomicfoundation/hardhat-chai-matchers");

describe("Liquidity Pool Contract", function () {
    let liquidityPool, stakingToken, anotherToken, owner, user1, user2;
    let stakingTokenAddress, anotherTokenAddress, liquidityPoolAddress;

    beforeEach(async function () {
        // Deploy the ERC20 mock tokens for token1 and token2
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");

        // Deploy stakingToken with error handling
        try {
            stakingToken = await ERC20Mock.deploy("Staking Token", "STK");
            await stakingToken.waitForDeployment();
            stakingTokenAddress = await stakingToken.getAddress();
            console.log("Staking Token Address:", stakingTokenAddress);
        } catch (error) {
            console.error("Error deploying stakingToken:", error);
        }

        // Deploy anotherToken with error handling
        try {
            anotherToken = await ERC20Mock.deploy("Another Token", "ANT");
            await anotherToken.waitForDeployment();
            anotherTokenAddress = await anotherToken.getAddress();
            console.log("Another Token Address:", anotherTokenAddress);
        } catch (error) {
            console.error("Error deploying anotherToken:", error);
        }

        // Check if the tokens were successfully deployed
        if (!stakingToken || !stakingTokenAddress) {
            throw new Error("Failed to deploy stakingToken. Address is undefined.");
        }
        if (!anotherToken || !anotherTokenAddress) {
            throw new Error("Failed to deploy anotherToken. Address is undefined.");
        }

        // Retrieve signers
        [owner, user1, user2] = await ethers.getSigners();
        console.log("Owner Address:", owner.address);
        console.log("User1 Address:", user1.address);
        console.log("User2 Address:", user2.address);

        // Mint tokens to users
        await stakingToken.mint(user1.address, ethers.parseEther("1000"));
        await anotherToken.mint(user1.address, ethers.parseEther("1000"));
        await stakingToken.mint(user2.address, ethers.parseEther("1000"));
        await anotherToken.mint(user2.address, ethers.parseEther("1000"));

        // Deploy the Liquidity Pool contract with two tokens
        const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        try {
            liquidityPool = await LiquidityPool.deploy(stakingTokenAddress, anotherTokenAddress);
            await liquidityPool.waitForDeployment();
            liquidityPoolAddress = await liquidityPool.getAddress();
            console.log("Liquidity Pool Contract Address:", liquidityPoolAddress);
        } catch (error) {
            console.error("Error deploying Liquidity Pool contract:", error);
            throw new Error("Failed to deploy Liquidity Pool contract. Check token addresses.");
        }
    });

    it("Should allow users to deposit liquidity", async function () {
        const amount1 = ethers.parseEther("100");
        const amount2 = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, amount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, amount2);

        await liquidityPool.connect(user1).addLiquidity(amount1, amount2);

        const [reserve1, reserve2] = await liquidityPool.getReserves();
        expect(reserve1).to.equal(amount1);
        expect(reserve2).to.equal(amount2);
    });

    it("Should update total liquidity after deposits", async function () {
        const amount1 = ethers.parseEther("100");
        const amount2 = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, amount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, amount2);
        await liquidityPool.connect(user1).addLiquidity(amount1, amount2);

        const [reserve1, reserve2] = await liquidityPool.getReserves();
        expect(reserve1).to.equal(amount1);
        expect(reserve2).to.equal(amount2);
    });

    it("Should allow multiple users to deposit liquidity independently", async function () {
        const amount1User1 = ethers.parseEther("50");
        const amount2User1 = ethers.parseEther("100");
        const amount1User2 = ethers.parseEther("25");
        const amount2User2 = ethers.parseEther("50");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, amount1User1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, amount2User1);
        await liquidityPool.connect(user1).addLiquidity(amount1User1, amount2User1);

        await stakingToken.connect(user2).approve(liquidityPoolAddress, amount1User2);
        await anotherToken.connect(user2).approve(liquidityPoolAddress, amount2User2);
        await liquidityPool.connect(user2).addLiquidity(amount1User2, amount2User2);

        const [reserve1, reserve2] = await liquidityPool.getReserves();
        expect(reserve1).to.equal(ethers.BigNumber.from(amount1User1).add(onintamount1User2));
        expect(reserve2).to.equal(ethers.BigNumber.from(amount2User1).add(amount2User2));
    });

    it("Should prevent deposits if token pair is not equal in value", async function () {
        const amount1 = ethers.parseEther("100");
        const amount2Incorrect = ethers.parseEther("200"); // Deliberately incorrect value

        await stakingToken.connect(user1).approve(liquidityPoolAddress, amount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, amount2Incorrect);

        await expect(
            liquidityPool.connect(user1).addLiquidity(amount1, amount2Incorrect)
        ).to.be.revertedWith("Tokens must be deposited in the correct proportion");
    });

    it("Should allow users to withdraw full liquidity", async function () {
        const amount1 = ethers.parseEther("100");
        const amount2 = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, amount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, amount2);
        await liquidityPool.connect(user1).addLiquidity(amount1, amount2);

        await liquidityPool.connect(user1).removeLiquidity(amount1);

        const [reserve1, reserve2] = await liquidityPool.getReserves();
        expect(reserve1).to.equal(ethers.BigNumber.from("0"));
        expect(reserve2).to.equal(ethers.BigNumber.from("0"));
    });

    it("Should allow users to withdraw partial liquidity", async function () {
        const amount1 = ethers.parseEther("200");
        const amount2 = ethers.parseEther("200");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, amount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, amount2);
        await liquidityPool.connect(user1).addLiquidity(amount1, amount2);

        await liquidityPool.connect(user1).removeLiquidity(ethers.parseEther("100")); // Withdraw half

        const [reserve1, reserve2] = await liquidityPool.getReserves();
        expect(reserve1).to.equal(ethers.parseEther("100"));
        expect(reserve2).to.equal(ethers.parseEther("100"));
    });

    it("Should allow users to swap tokens", async function () {
        const initialAmount1 = ethers.parseEther("100");
        const initialAmount2 = ethers.parseEther("200");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, initialAmount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, initialAmount2);
        await liquidityPool.connect(user1).addLiquidity(initialAmount1, initialAmount2);

        const swapAmount = ethers.parseEther("10");
        await stakingToken.connect(user2).approve(liquidityPoolAddress, swapAmount);

        const initialBalance = await anotherToken.balanceOf(user2.address);
        await liquidityPool.connect(user2).swap(stakingTokenAddress, swapAmount);

        const finalBalance = await anotherToken.balanceOf(user2.address);
        expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should update reserves after a swap", async function () {
        const initialAmount1 = ethers.parseEther("100");
        const initialAmount2 = ethers.parseEther("200");

        await stakingToken.connect(user1).approve(liquidityPoolAddress, initialAmount1);
        await anotherToken.connect(user1).approve(liquidityPoolAddress, initialAmount2);
        await liquidityPool.connect(user1).addLiquidity(initialAmount1, initialAmount2);

        const swapAmountIn = ethers.parseEther("10");
        await stakingToken.connect(user2).approve(liquidityPoolAddress, swapAmountIn);

        const [reserve1Before, reserve2Before] = await liquidityPool.getReserves();
        await liquidityPool.connect(user2).swap(stakingTokenAddress, swapAmountIn);
        const [reserve1After, reserve2After] = await liquidityPool.getReserves();

        expect(reserve1After).to.be.gt(reserve1Before); // token1 reserve increases
        expect(reserve2After).to.be.lt(reserve2Before); // token2 reserve decreases
    });
});
