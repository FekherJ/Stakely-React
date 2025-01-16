import { ethers, formatEther, parseUnits } from "ethers";
import { BigNumber } from "@ethersproject/bignumber"; // Import BigNumber correctly

import stakingAbi from "../abi/staking_abi.json";
import erc20Abi from "../abi/erc20Mock_abi.json";
import { getStakingContractAddress } from "../config/config";

let stakingContract = null;

const useStaking = () => {
  const initializeContract = async (provider, signer) => {
    if (!provider || !signer) {
      console.error("Provider or Signer is missing");
      throw new Error("Provider or Signer not available for contract initialization.");
    }

    try {
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      const stakingAddress = getStakingContractAddress(chainId);
      if (!stakingAddress) {
        throw new Error(`Staking contract address not found for chain ID: ${chainId}`);
      }

      if (!stakingContract || stakingContract.address !== stakingAddress) {
        const validatedAbi = Array.isArray(stakingAbi) ? stakingAbi : stakingAbi.abi;
        stakingContract = new ethers.Contract(stakingAddress, validatedAbi, signer);
        console.log("Contract initialized at:", stakingAddress);
      }

      return stakingContract;
    } catch (error) {
      console.error("Contract initialization failed:", error.message);
      throw error;
    }
  };

  const fetchDashboardData = async (provider, signer) => {
    try {
      const contract = await initializeContract(provider, signer);
      const address = await signer.getAddress();
      const walletBalance = await provider.getBalance(address);
      const stakingBalance = await contract.balances(address);
      const rewards = await contract.earned(address);

      const rewardRate = BigNumber.from(await contract.rewardRate());
      const totalStaked = BigNumber.from(await contract.totalSupply());

      const apy =
        rewardRate.isZero() || totalStaked.isZero()
          ? "0.00%"
          : `${rewardRate.mul(31557600).div(totalStaked).toString() / 100}%`;

      return {
        wallet: `${formatEther(walletBalance)} ETH`,
        staking: `${formatEther(stakingBalance)} STK`,
        rewards: `${formatEther(rewards)} RWD`,
        apy,
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error.message);
      throw error;
    }
  };

  const fetchTransactionHistory = async (provider, signer) => {
    try {
      const contract = await initializeContract(provider, signer);
      const filter = contract.filters.Staked();
      const events = await contract.queryFilter(filter, 0, "latest");
      return events.map((event) => ({
        type: "Staked",
        amount: formatEther(event.args.amount),
        timestamp: new Date(event.args.timestamp.toNumber() * 1000).toLocaleString(),
      }));
    } catch (error) {
      console.error("Error fetching transaction history:", error.message);
      throw error;
    }
  };

  const stakeTokens = async (amount, signer) => {
    try {
      const contract = await initializeContract(null, signer);
      const tokenAddress = await contract.stakingToken(); // Fetch token address dynamically
      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);

      const amountInWei = parseUnits(amount, 18);
      await tokenContract.approve(contract.address, amountInWei);
      const tx = await contract.stake(amountInWei);
      await tx.wait();
    } catch (error) {
      console.error("Error staking tokens:", error.message);
      throw error;
    }
  };

  const withdrawTokens = async (amount, signer) => {
    try {
      const contract = await initializeContract(null, signer);
      const amountInWei = parseUnits(amount, 18);
      const tx = await contract.withdraw(amountInWei);
      await tx.wait();
    } catch (error) {
      console.error("Error withdrawing tokens:", error.message);
      throw error;
    }
  };

  return { fetchDashboardData, fetchTransactionHistory, stakeTokens, withdrawTokens, initializeContract };
};

export default useStaking;
