import React from 'react';

const RewardsSection = ({ stakingContract, signer }) => {

  const claimRewards = async () => {
    if (!stakingContract || !signer) {
      alert("Please connect your wallet first.");
      return;
    }

    try {
      const tx = await stakingContract.getReward();
      await tx.wait();
      alert('Rewards claimed successfully.');
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Failed to claim rewards.');
    }
  };

  return (
    <div className="glass p-8 rounded-lg mb-8">
      <h2 className="text-3xl mb-4">Claim Your Rewards</h2>
      <div className="flex flex-col md:flex-row items-center">
        <button onClick={claimRewards} className="btn-primary text-xl px-8 py-4">
          Claim Rewards
        </button>
      </div>
    </div>
  );
};

export default RewardsSection;
