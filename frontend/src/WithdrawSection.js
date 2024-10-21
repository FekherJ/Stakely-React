import React, { useState } from 'react';
import { ethers } from 'ethers';

const WithdrawSection = ({ stakingContract, signer }) => {
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const withdrawTokens = async () => {
    if (!stakingContract || !signer) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const amountInWei = ethers.parseUnits(withdrawAmount, 18);  // Ethers v6 adjustment
      const tx = await stakingContract.withdraw(amountInWei);
      await tx.wait();
      alert(`Successfully withdrew ${withdrawAmount} tokens.`);
    } catch (error) {
      console.error('Error withdrawing tokens:', error);
      alert('Failed to withdraw tokens.');
    }
  };

  return (
    <div className="glass p-8 rounded-lg mb-8">
      <h2 className="text-3xl mb-4">Withdraw Your Tokens</h2>
      <div className="flex flex-col md:flex-row items-center">
        <input
          type="text"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Amount to withdraw (in tokens)"
          className="flex-1 p-3 bg-transparent border-b border-gray-300 text-white text-xl focus:outline-none mb-4 md:mb-0"
        />
        <button onClick={withdrawTokens} className="btn-primary text-xl ml-4 px-8 py-4">
          Withdraw Tokens
        </button>
      </div>
    </div>
  );
};

export default WithdrawSection;
