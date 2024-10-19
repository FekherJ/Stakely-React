// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing the ERC20 interface to interact with ERC20 tokens,
// and importing OpenZeppelin's Ownable, ReentrancyGuard, and Pausable contracts for added functionality.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

// Staking contract allows users to stake tokens and earn rewards
// Contract includes reentrancy protection, pausable functionality, and automatic reward compounding
contract Staking is Ownable, ReentrancyGuard, Pausable {
    
    // Public variables to store the staking token and the reward token
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // Reward rate per block, defines how many reward tokens are distributed per block
    uint256 public rewardRate = 100;
    // The last block number when rewards were updated
    uint256 public lastUpdateBlock;
    // The accumulated reward per token, stored value to track rewards between updates
    uint256 public rewardPerTokenStored;

    // Mapping to track the user's reward per token paid (used for calculating earned rewards)
    mapping(address => uint256) public userRewardPerTokenPaid;
    // Mapping to store the user's earned rewards
    mapping(address => uint256) public rewards;
    // Mapping to store the user's staked token balances
    mapping(address => uint256) public balances;

    // Events to log actions like staking, withdrawing, reward payment, and reward compounding
    event Staked(address indexed user, uint256 amount);       // Logs staking action
    event Withdrawn(address indexed user, uint256 amount);    // Logs withdrawal action
    event RewardPaid(address indexed user, uint256 reward);   // Logs reward payment
    event Compounded(address indexed user, uint256 reward);   // Logs reward compounding action

    // Constructor initializes the staking and reward tokens with the provided addresses
    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken); // Staking token
        rewardToken = IERC20(_rewardToken);   // Reward token
    }

    // Stake function: Allows users to stake a specific amount of tokens
    // Uses nonReentrant to prevent reentrancy attacks and whenNotPaused to allow staking only when contract is not paused
    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0"); // Check that the stake amount is non-zero
        balances[msg.sender] += amount;        // Increase user's staking balance
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Stake transfer failed"); // Transfer tokens to the contract
        emit Staked(msg.sender, amount);       // Emit event for the staking action
    }

    // Withdraw function: Allows users to withdraw staked tokens
    // Uses nonReentrant and whenNotPaused, and ensures rewards are updated before withdrawal
    function withdraw(uint256 amount) public nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");         // Check for non-zero withdrawal
        require(balances[msg.sender] >= amount, "Insufficient balance"); // Ensure the user has enough balance
        balances[msg.sender] -= amount;                   // Decrease user's staking balance
        require(stakingToken.transfer(msg.sender, amount), "Withdraw transfer failed"); // Transfer tokens back to the user
        emit Withdrawn(msg.sender, amount);               // Emit event for the withdrawal
    }

    // getReward function: Allows users to claim their earned rewards
    // Uses nonReentrant and whenNotPaused to ensure safety
    function getReward() public nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];             // Get the user's reward balance
        require(reward > 0, "No reward available");       // Check if there is a reward to claim
        rewards[msg.sender] = 0;                          // Reset the user's reward balance
        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed"); // Transfer the reward tokens to the user
        emit RewardPaid(msg.sender, reward);              // Emit event for reward payment
    }

    // compoundRewards function: Allows users to automatically stake their rewards into the staking pool
    function compoundRewards() public nonReentrant whenNotPaused updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];             // Get the user's reward balance
        require(reward > 0, "No reward available to compound"); // Ensure the user has rewards to compound
        rewards[msg.sender] = 0;                          // Reset the user's reward balance
        balances[msg.sender] += reward;                   // Add the reward to the user's staking balance
        emit Compounded(msg.sender, reward);              // Emit event for compounding the rewards
    }

    // updateReward modifier: Updates the user's reward information before executing any staking, withdrawal, or reward claim action
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();          // Update the stored reward per token
        lastUpdateBlock = block.number;                   // Update the last update block
        rewards[account] = earned(account);               // Update the user's earned rewards
        userRewardPerTokenPaid[account] = rewardPerTokenStored; // Set the user's reward per token paid to the new value
        _;                                                // Proceed with the rest of the function
    }

    // rewardPerToken function: Calculates and returns the current reward per token based on the elapsed blocks and total staked tokens
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored; // If no tokens are staked, return the stored value
        }
        // Calculate new reward per token based on the blocks since the last update and total staked tokens
        return rewardPerTokenStored + ((block.number - lastUpdateBlock) * rewardRate * 1e18) / totalSupply();
    }

    // earned function: Calculates the total rewards earned by a user
    // This function calculates the user's earned rewards based on their staking balance and previously paid rewards
    function earned(address account) public view returns (uint256) {
        return (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }

    // totalSupply function: Returns the total amount of staked tokens in the contract
    function totalSupply() public view returns (uint256) {
        return stakingToken.balanceOf(address(this)); // Returns the contract's balance of staked tokens
    }

    // Pausable functions to allow the owner to pause and unpause the contract in case of emergency
    function pause() external onlyOwner {
        _pause(); // Pause the contract
    }

    function unpause() external onlyOwner {
        _unpause(); // Unpause the contract
    }

    // New function to change the reward rate, ensuring rewards are updated first
    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        rewardRate = newRate;
    }
}