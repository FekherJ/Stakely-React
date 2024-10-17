const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Contract", function () {
    let stakingToken, rewardToken, stakingContract;
    let owner, user1, user2;
    const rewardRate = 100;

    beforeEach(async function () {
        // Deploy ERC20 tokens
        const ERC20 = await ethers.getContractFactory("ERC20Mock");
        stakingToken = await ERC20.deploy("Staking Token", "STK");
        await stakingToken.waitForDeployment(); // Wait for deployment to complete
        const stakingTokenAddress = await stakingToken.getAddress(); // Get the staking token address

        rewardToken = await ERC20.deploy("Reward Token", "RWD");
        await rewardToken.waitForDeployment(); // Wait for deployment to complete
        const rewardTokenAddress = await rewardToken.getAddress(); // Get the reward token address

        // DEBUG
        console.log("Staking token deployed at:", stakingTokenAddress);
        console.log("Reward token deployed at:", rewardTokenAddress);

        // Mint tokens to owner and users
        [owner, user1, user2] = await ethers.getSigners();
        await stakingToken.mint(owner.address, ethers.parseEther("1000"));
        await stakingToken.mint(user1.address, ethers.parseEther("1000"));
        await stakingToken.mint(user2.address, ethers.parseEther("1000"));
        await rewardToken.mint(owner.address, ethers.parseEther("1000"));

        // Deploy staking contract
        const Staking = await ethers.getContractFactory("Staking");
        stakingContract = await Staking.deploy(stakingTokenAddress, rewardTokenAddress); // Pass the addresses correctly
        await stakingContract.waitForDeployment(); // Wait for deployment to complete
        const stakingContractAddress = await stakingContract.getAddress(); // Get the staking contract address

        console.log("Staking Contract deployed at:", stakingContractAddress); // Debug log
    });

    it("Should allow user to stake tokens", async function () {
        // Approve and stake tokens for user1
        await stakingToken.connect(user1).approve(stakingContract.getAddress(), ethers.parseEther("100"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));

        // Check staking balance
        const balance = await stakingContract.balances(user1.address);
        expect(balance).to.equal(ethers.parseEther("100"));
    });

    it("Should allow user to withdraw staked tokens", async function () {
        // Stake first
        await stakingToken.connect(user1).approve(stakingContract.getAddress(), ethers.parseEther("100"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));

        // Withdraw the tokens
        await stakingContract.connect(user1).withdraw(ethers.parseEther("50"));

        // Check staking balance
        const balance = await stakingContract.balances(user1.address);
        expect(balance).to.equal(ethers.parseEther("50"));
    });

    it("Should calculate and distribute rewards", async function () {
        // Stake tokens for user1
        await stakingToken.connect(user1).approve(stakingContract.getAddress(), ethers.parseEther("100"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));

        // Fast-forward in time by 10 blocks
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);

        // Owner transfers reward tokens to the contract for distribution
        await rewardToken.transfer(stakingContract.getAddress(), ethers.parseEther("100"));

        // Check reward earned by user1
        const earned = await stakingContract.earned(user1.address);
        expect(earned).to.be.above(0); // Ensure some rewards are earned
    });

    it("Should allow users to claim rewards", async function () {
        // Stake tokens for user1
        await stakingToken.connect(user1).approve(stakingContract.getAddress(), ethers.parseEther("100"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));

        // Fast-forward in time by a few blocks
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);

        // Owner transfers reward tokens to the contract
        await rewardToken.transfer(stakingContract.getAddress(), ethers.parseEther("100"));

        // Claim the reward
        await stakingContract.connect(user1).getReward();

        // Check reward balance of user1
        const rewardBalance = await rewardToken.balanceOf(user1.address);
        expect(rewardBalance).to.be.above(0); // Ensure reward tokens are claimed
    });

    it("Should allow users to compound rewards", async function () {
        // Stake tokens for user1
        await stakingToken.connect(user1).approve(stakingContract.getAddress(), ethers.parseEther("100"));
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));

        // Fast-forward in time by a few blocks
        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);

        // Owner transfers reward tokens to the contract
        await rewardToken.transfer(stakingContract.getAddress(), ethers.parseEther("100"));

        // Compound the rewards into the staking balance
        await stakingContract.connect(user1).compoundRewards();

        // Check updated staking balance (should include compounded rewards)
        const updatedBalance = await stakingContract.balances(user1.address);
        expect(updatedBalance).to.be.above(ethers.parseEther("100")); // Should be greater than initial staking amount
    });

    it("Should allow the owner to pause and unpause the contract", async function () {
        // Pause the contract
        await stakingContract.pause();

        // Attempt staking while paused should fail
        await stakingToken.connect(user1).approve(stakingContract.getAddress(), ethers.parseEther("100"));
        await expect(stakingContract.connect(user1).stake(ethers.parseEther("100"))).to.be.revertedWith("Pausable: paused");

        // Unpause the contract
        await stakingContract.unpause();

        // Now staking should succeed
        await stakingContract.connect(user1).stake(ethers.parseEther("100"));
        const balance = await stakingContract.balances(user1.address);
        expect(balance).to.equal(ethers.parseEther("100"));
    });
});
