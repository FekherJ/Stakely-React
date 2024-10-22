// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LiquidityPool {
    // Define storage variables
    mapping(address => uint256) public userLiquidity;
    mapping(address => uint256) public userRewards;
    uint256 public totalLiquidityETH;
    uint256 public totalLiquiditySTK;
    uint256 public totalRewards; // Total rewards available for distribution

    address[] public users; // Track users who have deposited liquidity

    IERC20 public stakingToken;

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    // Add liquidity to the pool with proportional check (1 ETH = 100 STK)
    function depositLiquidity(uint256 ethAmount, uint256 stkAmount) external payable {
        require(msg.value == ethAmount, "Must send the correct ETH amount");

        // Ensure the ratio is maintained: 1 ETH = 100 STK
        uint256 expectedStkAmount = ethAmount * 100; // Adjust proportion based on the ratio
        require(stkAmount == expectedStkAmount, "Tokens must be deposited in the correct proportion");

        // Perform deposit logic and update userLiquidity and totalLiquidityETH/STK
        if (userLiquidity[msg.sender] == 0) {
            users.push(msg.sender); // Add new users to the users array
        }

        userLiquidity[msg.sender] += ethAmount;
        totalLiquidityETH += ethAmount;
        totalLiquiditySTK += stkAmount;

        // Transfer staking tokens from the user to the pool
        stakingToken.transferFrom(msg.sender, address(this), stkAmount);
    }

    // Simulate adding rewards (owner or external admin function)
    function addRewards(uint256 rewardAmount) external {
        totalRewards += rewardAmount; // Assume rewards are added in tokens
        // Transfer reward tokens to the pool (you can add access control to this function)
        stakingToken.transferFrom(msg.sender, address(this), rewardAmount);
    }

    // Distribute rewards proportionally based on liquidity
    function distributeRewards() external {
        require(totalLiquidityETH > 0, "No liquidity in the pool to distribute rewards");

        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 userLiquidityShare = userLiquidity[user];

            // Calculate the user's share of rewards based on their liquidity
            uint256 userReward = (userLiquidityShare * totalRewards) / totalLiquidityETH;
            userRewards[user] += userReward;
        }

        // Reset totalRewards after distribution
        totalRewards = 0;
    }

    // Function to claim rewards
    function claimRewards() external {
        uint256 reward = userRewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        // Transfer rewards to user
        userRewards[msg.sender] = 0;
        stakingToken.transfer(msg.sender, reward);
    }

    // Withdraw liquidity from the pool
    function withdrawLiquidity(uint256 ethAmount) external {
        require(userLiquidity[msg.sender] >= ethAmount, "Not enough liquidity to withdraw");

        // Calculate the corresponding staking token (STK) amount to withdraw
        uint256 stkAmount = (ethAmount * totalLiquiditySTK) / totalLiquidityETH;

        // Update user liquidity and pool liquidity
        userLiquidity[msg.sender] -= ethAmount;
        totalLiquidityETH -= ethAmount;
        totalLiquiditySTK -= stkAmount;

        // Transfer ETH and staking tokens back to the user
        payable(msg.sender).transfer(ethAmount);
        stakingToken.transfer(msg.sender, stkAmount);
    }
}

// Interface for ERC20 token interactions
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}
