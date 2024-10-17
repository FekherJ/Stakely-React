
# Testing on Remix (Staking Contract)

## Overview
This guide provides step-by-step instructions to deploy and test the **Staking Contract** using the Remix IDE. It covers the deployment of the staking token, reward token, and staking contract, followed by simulating interactions like staking, withdrawing, compounding rewards, and checking balances. This guide is tailored for testing in local or test environments using Remix’s **JavaScript VM**.

## Prerequisites
- Familiarity with Solidity, Remix IDE, and interacting with smart contracts.
- Basic understanding of ERC20 tokens and staking mechanisms.
- Knowledge of Ether and wei conversions.

## Key Steps Recap
1. **Deploy Contracts**: Deploy the `ERC20Mock` for the staking and reward tokens, followed by the staking contract.
2. **Mint Tokens**: Mint tokens for the staking token and reward token to the owner and users.
3. **Stake Tokens**: Stake tokens into the staking contract from a user’s account.
4. **Withdraw Tokens**: Test the withdrawal of tokens from the staking contract.
5. **Compound Rewards**: Simulate compounding rewards into the staking balance.
6. **Pause/Unpause Contract**: Test pausing and unpausing the contract functionality.

---

## Deploying the Contracts

### 1. Deploy `ERC20Mock` (Staking and Reward Tokens)
Deploy two instances of the `ERC20Mock` contract:
- One for the **staking token** (e.g., STK).
- One for the **reward token** (e.g., RWD).

#### Steps:
- **Deploy `ERC20Mock` (Staking Token)**:  
  Deploy the `ERC20Mock` contract with "Staking Token" as the name and `STK` as the symbol.
  
- **Deploy `ERC20Mock` (Reward Token)**:  
  Deploy another `ERC20Mock` contract with "Reward Token" as the name and `RWD` as the symbol.

- **Verify Token Balances**:  
  Use the `balanceOf` function to verify the deployer’s initial balances. Each account should have a supply of minted tokens (e.g., 1,000 tokens).

### 2. Deploy the Staking Contract
After deploying the staking and reward tokens, deploy the staking contract.

#### Steps:
- **Deploy Staking Contract**:  
  Deploy the Staking contract, passing in the addresses of the staking token and reward token deployed in the previous step. Once deployed, the contract should be ready to receive staking and reward tokens.
  
- **Mint Tokens**:  
  Use the `mint` function of the staking and reward tokens to mint tokens for the owner and users. This will simulate token ownership for the testing accounts.  
  Example: Mint 1,000 tokens to the owner and users (e.g., `user1`, `user2`) from the deployer account.

---

## Testing Contract Interactions

### 1. Staking Tokens
Simulate staking tokens from a user’s account into the staking contract.

#### Steps:
- **Approve Staking Contract**:  
  From `user1`, approve the staking contract to spend their tokens. Use the `approve` function in the staking token contract, passing in the staking contract’s address and the amount of tokens to approve (e.g., 100 tokens).
  
- **Stake Tokens**:  
  From `user1`, call the `stake` function on the staking contract and stake the approved tokens (e.g., 100 tokens).  
  Verify the `balances` function on the staking contract to check that `user1` has 100 staked tokens.

### 2. Withdraw Staked Tokens
Simulate withdrawing staked tokens from the staking contract.

#### Steps:
- **Withdraw Tokens**:  
  From `user1`, call the `withdraw` function on the staking contract, passing in the number of tokens to withdraw (e.g., 50 tokens).  
  Verify the `balances` function on the staking contract to check that `user1` now has 50 staked tokens remaining.

### 3. Compounding Rewards
Simulate compounding earned rewards into the user’s staking balance.

#### Steps:
- **Transfer Reward Tokens**:  
  Transfer reward tokens (e.g., 100 RWD) to the staking contract using the `transfer` function from the reward token contract.

- **Compound Rewards**:  
  Call the `compoundRewards` function from `user1` on the staking contract. This will add earned rewards to the user’s staking balance.  
  Verify that the staking balance of `user1` has increased by checking the `balances` function.

### 4. Pause/Unpause the Contract
Test the contract’s ability to pause and unpause staking activities.

#### Steps:
- **Pause the Contract**:  
  From the owner account, call the `pause` function on the staking contract.  
  Attempt to stake tokens from `user1` while the contract is paused. The transaction should revert with an error message (`Pausable: paused`).
  
- **Unpause the Contract**:  
  From the owner account, call the `unpause` function on the staking contract.  
  Now, staking should be allowed again.

---

## Additional Notes
- **Testing on a Testnet**:  
  If deploying to a testnet (Goerli, Ropsten), ensure that you have test ETH and that the contract is connected to a MetaMask wallet.
  
- **Gas Fees**:  
  When interacting on testnets, account for gas fees when calling functions that modify the contract state.

---

## Conclusion
By following these steps, you can deploy and test your staking contract using the Remix IDE. This guide covers the basic interactions of staking, withdrawing, compounding rewards, and pausing the contract. This setup allows you to ensure the contract works as expected before deploying to a live environment, such as a testnet or mainnet.
