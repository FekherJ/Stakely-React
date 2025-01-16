import React, { useState } from 'react'; // Add useState here
import { useWallet } from './components/WalletProvider';
import Dashboard from './components/Dashboard';
import StakingActions from './components/StakingActions';

const MainApp = () => {
  const { connectWallet, address } = useWallet();
  const [error, setError] = useState(''); // Correctly imported now

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <button onClick={handleConnect}>
        {address ? `Connected: ${address.substring(0, 6)}...` : 'Connect Wallet'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Dashboard />
      <StakingActions />
    </div>
  );
};

export default MainApp;
