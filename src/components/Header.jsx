import React from 'react';
import useWallet from '../hooks/useWallet';

const Header = () => {
  const { connectWallet, address } = useWallet();

  return (
    <header className="flex justify-between items-center p-6 bg-gray-800 shadow-md">
      <h1 className="text-3xl font-bold">Stakely</h1>
      <button
        onClick={connectWallet}
        className="bg-blue-500 hover:bg-blue-600 px-6 py-2 text-white rounded-lg font-semibold shadow"
      >
        {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
      </button>
    </header>
  );
};

export default Header;
