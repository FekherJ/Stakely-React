import React, { useState } from 'react';
import { useWallet } from '../components/WalletProvider';
import useStaking from '../hooks/useStaking';

const StakingActions = () => {
  const { provider, signer, stakingContract } = useWallet();
  const { stakeTokens, withdrawTokens } = useStaking();
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleStake = async () => {
    if (!provider || !signer || !stakingContract) {
      alert('Please connect your wallet and ensure the staking contract is initialized.');
      return;
    }
    try {
      await stakeTokens(stakeAmount);
      alert(`Successfully staked ${stakeAmount} tokens.`);
    } catch (error) {
      console.error('Error staking tokens:', error.message);
      alert('Failed to stake tokens.');
    }
  };

  const handleWithdraw = async () => {
    if (!provider || !signer || !stakingContract) {
      alert('Please connect your wallet first.');
      return;
    }
    try {
      await withdrawTokens(withdrawAmount);
      alert(`Withdrew ${withdrawAmount} tokens successfully!`);
    } catch (error) {
      console.error('Withdrawal error:', error.message);
    }
  };

  return (
    <div className="staking-actions glass p-6 rounded-lg shadow-lg">
      <div className="action">
        <h3 className="text-lg font-medium">Stake Tokens</h3>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Enter amount to stake"
          className="input-field"
        />
        <button onClick={handleStake} className="btn-primary mt-2">Stake</button>
      </div>
      <div className="action mt-6">
        <h3 className="text-lg font-medium">Withdraw Tokens</h3>
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Enter amount to withdraw"
          className="input-field"
        />
        <button onClick={handleWithdraw} className="btn-primary mt-2">Withdraw</button>
      </div>
    </div>
  );
};

export default StakingActions;
