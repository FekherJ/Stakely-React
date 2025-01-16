import { useWallet } from '../components/WalletProvider';

const useStaking = () => {
  const { stakingContract } = useWallet();

  const fetchDashboardData = async () => {
    if (!stakingContract) throw new Error('Staking contract not initialized.');

    const signer = stakingContract.signer;
    const walletAddress = await signer.getAddress();
    const walletBalance = await signer.provider.getBalance(walletAddress);
    const stakingBalance = await stakingContract.balances(walletAddress);
    const rewards = await stakingContract.earned(walletAddress);

    return {
      wallet: `${ethers.utils.formatEther(walletBalance)} ETH`,
      staking: `${ethers.utils.formatEther(stakingBalance)} STK`,
      rewards: `${ethers.utils.formatEther(rewards)} RWD`,
    };
  };

  return { fetchDashboardData };
};

export default useStaking;
