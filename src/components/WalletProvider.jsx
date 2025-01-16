import React, { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import stakingAbiJson from '../abi/staking_abi.json';
import { getStakingContractAddress } from '../config/config';

const stakingAbi = stakingAbiJson.abi; // Extract ABI property
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask not found. Please install MetaMask.');
      return;
    }

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const walletAddress = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();

      const chainId = Number(network.chainId);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(walletAddress);
      setChainId(chainId);

      const stakingAddress = getStakingContractAddress(chainId);
      const contract = new ethers.Contract(stakingAddress, stakingAbi, web3Signer);
      setStakingContract(contract);

      console.log('Wallet connected:', walletAddress);
      console.log('Staking contract initialized at:', stakingAddress);
    } catch (error) {
      console.error('Wallet connection failed:', error.message);
      alert('Failed to connect wallet. Check your MetaMask configuration.');
    }
  };

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        address,
        stakingContract,
        connectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
