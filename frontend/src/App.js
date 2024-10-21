import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';  // Importing your custom styles
import StakeSection from './StakeSection';
import WithdrawSection from './WithdrawSection';
import RewardsSection from './RewardsSection';

// Import the ABI for the staking contract
import stakingAbi from './abi/staking_abi.json';

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [stakingBalance, setStakingBalance] = useState('0.0000 STK');
  const [rewardBalance, setRewardBalance] = useState('0.0000 RWD');
  const [walletBalance, setWalletBalance] = useState('0.0000 ETH');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [activeTab, setActiveTab] = useState('stake'); // For tab navigation

  // Contract address for staking
  const stakingContractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';  // Replace this with the actual address

  useEffect(() => {
    if (walletAddress) {
      fetchBalances();
    }
  }, [walletAddress]);

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);  // Ethers v6 adjustment
        const _signer = await _provider.getSigner();
        const address = await _signer.getAddress();
        setProvider(_provider);
        setSigner(_signer);
        setWalletAddress(address);

        const _stakingContract = new ethers.Contract(stakingContractAddress, stakingAbi, _signer);
        setStakingContract(_stakingContract);

        const balance = await _provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balance) + ' ETH');  // Ethers v6 adjustment
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('MetaMask not found. Please install it.');
    }
  };

  // Fetch balances
  const fetchBalances = async () => {
    if (!stakingContract) return;
    try {
      const stakingBalance = await stakingContract.balances(walletAddress);
      setStakingBalance(ethers.formatUnits(stakingBalance, 18) + ' STK');  // Ethers v6 adjustment

      const rewardBalance = await stakingContract.rewards(walletAddress);
      setRewardBalance(ethers.formatUnits(rewardBalance, 18) + ' RWD');  // Ethers v6 adjustment
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'stake') {
      return <StakeSection stakingContract={stakingContract} signer={signer} />;
    } else if (activeTab === 'withdraw') {
      return <WithdrawSection stakingContract={stakingContract} signer={signer} />;
    } else if (activeTab === 'rewards') {
      return <RewardsSection stakingContract={stakingContract} signer={signer} />;
    }
  };

  return (
    <div className="App container mx-auto p-8 text-center">
      <h1 className="text-5xl font-bold mb-8">🌌 Web3 Staking Platform</h1>
      <button onClick={connectWallet} className="btn-primary text-xl px-8 py-4">
        {walletAddress ? `Connected: ${walletAddress}` : 'Connect Wallet'}
      </button>

      {walletAddress && (
        <div className="glass p-8 mb-8 rounded-lg shadow-lg">
          <h2 className="text-3xl mb-4">📊 User Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p>Wallet Balance (ETH):</p>
              <p className="font-bold text-2xl">{walletBalance}</p>
            </div>
            <div>
              <p>Staking Balance (STK):</p>
              <p className="font-bold text-2xl">{stakingBalance}</p>
            </div>
            <div>
              <p>Reward Balance (RWD):</p>
              <p className="font-bold text-2xl">{rewardBalance}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-8 mb-8">
        <button onClick={() => setActiveTab('stake')} className={`tab-${activeTab === 'stake' ? 'active' : 'inactive'} p-3 rounded-lg text-lg font-semibold`}>
          Stake
        </button>
        <button onClick={() => setActiveTab('withdraw')} className={`tab-${activeTab === 'withdraw' ? 'active' : 'inactive'} p-3 rounded-lg text-lg font-semibold`}>
          Withdraw
        </button>
        <button onClick={() => setActiveTab('rewards')} className={`tab-${activeTab === 'rewards' ? 'active' : 'inactive'} p-3 rounded-lg text-lg font-semibold`}>
          Rewards
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default App;
