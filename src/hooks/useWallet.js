import { useState } from 'react';
import { ethers } from 'ethers';

const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') throw new Error('MetaMask not found.');

    console.log('Provider:', provider);
    console.log('Signer:', signer);


    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const walletAddress = await web3Signer.getAddress();

      const network = await web3Provider.getNetwork();
      const chainId = Number(network.chainId.toString()); // Convert BigInt to Number
      console.log('Connected Chain ID:', chainId);

      if (![31337, 1337, 11155111].includes(chainId)) { // Added Sepolia Chain ID (11155111)
        throw new Error('Unsupported network. Please switch to Sepolia or Localhost (31337/1337).');
      }

      console.log('Network:', network);
      console.log('Wallet Address:', walletAddress);


      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(walletAddress);

      return { provider: web3Provider, signer: web3Signer, chainId, address: walletAddress };
    } catch (error) {
      console.error('Wallet connection failed:', error.message);
      throw error;
    }
  };

  return { provider, signer, address, connectWallet };
};

export default useWallet;
