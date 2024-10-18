
# Testing on Remix (Staking Contract)

## Overview
This guide provides step-by-step instructions to deploy and test the **Staking Contract** using the Remix IDE. It covers the deployment of the staking token, reward token, and staking contract, followed by simulating interactions like staking, withdrawing, compounding rewards, and checking balances. This guide is tailored for testing in local or test environments using Remix’s **JavaScript VM**.

## Prerequisites
- Familiarity with Solidity, Remix IDE, and interacting with smart contracts.
- Basic understanding of ERC20 tokens and staking mechanisms.
- Knowledge of Ether and wei conversions.

## Key Steps Recap
1. **Deploy Contracts**: Deploy the `ERC20Mock` for the staking and reward tokens, followed by the staking contract.
2. **Mint Tokens**: **(Important)** After deploying the tokens, make sure to mint tokens to the owner and users using the `mint()` function. Without minting, token balances will remain 0. Here is an example:
   
   ```solidity
   stakingToken.mint(<user_address>, <amount>);
   rewardToken.mint(<user_address>, <amount>);
   ```

   Replace `<user_address>` with the desired address and `<amount>` with the number of tokens you wish to mint. 

3. **Stake Tokens**: Stake tokens into the staking contract from a user’s account.
4. **Withdraw Tokens**: Test the withdrawal functionality for staked tokens.
5. **Claim Rewards**: Simulate the claiming of staking rewards to verify the reward mechanism.

## Example Flow in Remix
1. Deploy the `ERC20Mock` contract for both the staking token and reward token.
2. Deploy the staking contract, linking it to both the staking and reward tokens.
3. Call the `mint()` function for both tokens:
   ```solidity
   stakingToken.mint("0xYourAddressHere", 1000);
   rewardToken.mint("0xYourAddressHere", 500);
   ```
4. Use the `approve()` function for the staking token to allow the staking contract to spend tokens on behalf of the user.
5. Stake the tokens by interacting with the staking contract’s `stake()` function.
6. Check balances using `balanceOf()` to confirm successful staking.
7. Claim rewards after sufficient staking time has passed using the `claimRewards()` function.
8. Withdraw tokens with `withdraw()`.

## Troubleshooting
- If balances are 0, ensure that the minting step has been executed correctly after deployment.
- Ensure proper approval for token transfers between user and staking contract.

