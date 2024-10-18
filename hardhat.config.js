require("@nomicfoundation/hardhat-ethers");
require('dotenv').config(); // Added to load .env variables

if (!process.env.ALCHEMY_URL || !process.env.PRIVATE_KEY) {
  console.error("Error: Please check your .env file to ensure that ALCHEMY_URL and PRIVATE_KEY are set correctly.");
  process.exit(1); // Exit if environment variables are missing
}

module.exports = {
  solidity: "0.8.24",
  networks: {
      sepolia: {  // --network sepolia
        url: process.env.ALCHEMY_URL,  // Your Infura/Alchemy Sepolia URL
        accounts: [process.env.PRIVATE_KEY]  // Your MetaMask private key
      },
      localhost: {
        url: "http://127.0.0.1:8545", // Default local network settings for Hardhat
        chainId: 1337, 
      },
      
      hardhat: {
        chainId: 1337,
      },

    },
};