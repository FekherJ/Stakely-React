import React, { useEffect, useState } from 'react';
import { useWallet } from '../components/WalletProvider';
import useStaking from '../hooks/useStaking';

const Dashboard = () => {
  const { provider, signer, stakingContract } = useWallet();
  const { fetchDashboardData } = useStaking();
  const [balances, setBalances] = useState({
    wallet: '0.0000 ETH',
    staking: '0.0000 STK',
    rewards: '0.0000 RWD',
    apy: '0.00%',
  });

  useEffect(() => {
    const loadBalances = async () => {
      if (!stakingContract) {
        console.warn('Staking contract is not initialized yet.');
        return;
      }
      try {
        const dashboardData = await fetchDashboardData();
        setBalances(dashboardData);
      } catch (error) {
        console.error('Error loading dashboard:', error.message);
        alert('Failed to load dashboard data.');
      }
    };
    loadBalances();
  }, [stakingContract]);

  return (
    <div className="dashboard glass p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">📊 Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(balances).map(([key, value]) => (
          <div key={key} className="balance-item">
            <p className="text-sm font-medium capitalize">{key}:</p>
            <p className="font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
