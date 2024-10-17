require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-waffle");


module.exports = {
  solidity: "0.8.24",
  networks: {
      sepolia: {
        url: process.env.INFURA_URL,  // Your Infura/Alchemy Sepolia URL
        accounts: [process.env.PRIVATE_KEY]  // Your MetaMask private key
      },
      localhost: {
        url: "http://127.0.0.1:8545", // Default local network settings for Hardhat
        chainId: 31337, 
      },

      hardhat: {
        chainId: 1337,
      },

    },
};
