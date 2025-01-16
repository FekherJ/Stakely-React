import React, { useState, useEffect } from 'react';
import useWallet from '../hooks/useWallet';
import useStaking from '../hooks/useStaking';

const StakingActions = () => {
  const { connectWallet } = useWallet();
  const { stakeTokens, withdrawTokens, initializeContract } = useStaking();
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');

  useEffect(() => {
    const fetchTokenAddress = async () => {
      try {
        const { provider, signer } = await connectWallet();
        const contract = await initializeContract(provider, signer);
        setTokenAddress(await contract.stakingToken());
      } catch (error) {
        console.error('Failed to fetch token address:', error.message);
      }
    };

    fetchTokenAddress();
  }, []);

  const handleStake = async () => {
    try {
      await stakeTokens(stakeAmount, tokenAddress);
      alert(`Staked ${stakeAmount} tokens successfully!`);
    } catch (error) {
      console.error('Staking error:', error.message);
    }
  };

  const handleWithdraw = async () => {
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
