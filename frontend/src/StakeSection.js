import React, { useState } from 'react';
import { ethers } from 'ethers';

const StakeSection = ({ stakingContract, signer }) => {
  const [stakeAmount, setStakeAmount] = useState('');

  const stakeTokens = async () => {
    if (!signer || !stakingContract) {
      alert("Please connect your wallet and initialize the contract.");
      return;
    }

    try {
      // Step 1: Dynamically load the staking token address from the staking contract
      const stakingTokenAddress = await stakingContract.stakingToken();
      console.log("Staking token address:", stakingTokenAddress);

      // Load the ERC20 token contract dynamically using the staking token address
      const tokenContract = new ethers.Contract(stakingTokenAddress, [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
        "function balanceOf(address owner) public view returns (uint256)"
      ], signer);

      const stakeAmountInWei = ethers.parseUnits(stakeAmount, 18);

      // Step 2: Check if the user has enough balance
      const userBalance = await tokenContract.balanceOf(await signer.getAddress());
      console.log("User balance (in tokens):", userBalance.toString());

      // Ensure userBalance is a BigNumber before comparing
      if (ethers.BigNumber.from(userBalance).lt(stakeAmountInWei)) {
        alert("Insufficient token balance for staking.");
        return;
      }

      // Step 3: Check the allowance for the staking contract
      const allowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);
      console.log("Allowance:", allowance.toString());

      // Ensure allowance is a BigNumber before comparing
      if (ethers.BigNumber.from(allowance).lt(stakeAmountInWei)) {
        console.log("Approving tokens...");
        const approvalTx = await tokenContract.approve(stakingContract.address, stakeAmountInWei);
        await approvalTx.wait();
        console.log("Tokens approved successfully.");
      }

      // Step 4: Stake the tokens once approved
      console.log("Staking tokens...");
      const stakeTx = await stakingContract.stake(stakeAmountInWei);
      await stakeTx.wait();
      alert(`Successfully staked ${stakeAmount} tokens.`);
      // Call updateDashboard() or similar to update the balances after staking
    } catch (error) {
      console.error('Error staking tokens:', error);
      alert('Failed to stake tokens.');
    }
  };

  return (
    <div className="glass p-8 rounded-lg mb-8">
      <h2 className="text-3xl mb-4">Stake Your Tokens</h2>
      <div className="flex flex-col md:flex-row items-center">
        <input
          type="text"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake (in tokens)"
          className="flex-1 p-3 bg-transparent border-b border-gray-300 text-white text-xl focus:outline-none mb-4 md:mb-0"
        />
        <button onClick={stakeTokens} className="btn-primary text-xl ml-4 px-8 py-4">
          Stake Tokens
        </button>
      </div>
    </div>
  );
};

export default StakeSection;
