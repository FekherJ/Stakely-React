let provider;
let signer;
let stakingContract;

const stakingContractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';  // Replace with your actual Sepolia contract address

// Fetch the ABI from the external JSON file
async function loadABI() {
    try {
        const response = await fetch('staking_abi.json');  // Fetch the ABI from the external file
        const abi = await response.json();
        return abi;
    } catch (error) {
        console.error('Failed to load ABI:', error);
        return null;
    }
}

// Update status message in the UI
function updateStatus(message) {
    document.getElementById("statusMessage").innerText = message;
}

// Connect to MetaMask and explicitly specify Sepolia network
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Explicitly set the provider to Sepolia
            provider = new ethers.providers.Web3Provider(window.ethereum, {
                name: "sepolia",
                chainId: 11155111  // Sepolia network chain ID
            });

            // Request MetaMask accounts
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();

            // Ensure we're connected to Sepolia
            const network = await provider.getNetwork();
            if (network.chainId !== 11155111) {
                updateStatus('Please connect MetaMask to the Sepolia network.');
                return;
            }

            updateStatus('Wallet connected: ' + await signer.getAddress());

            // Load the ABI and initialize the contract
            const abi = await loadABI();
            if (abi) {
                stakingContract = new ethers.Contract(stakingContractAddress, abi, signer);
            } else {
                updateStatus('Failed to load contract ABI.');
            }
        } catch (error) {
            updateStatus('Error connecting wallet: ' + error.message);
        }
    } else {
        alert('MetaMask not found. Please install it to interact with the contract.');
    }
}

// Stake tokens
async function stakeTokens() {
    const amountToStake = document.getElementById("stakeAmount").value;
    if (!amountToStake) {
        updateStatus("Please enter an amount to stake.");
        return;
    }
    try {
        const parsedAmount = ethers.utils.parseUnits(amountToStake, 18);  // Assuming 18 decimals
        const tx = await stakingContract.stake(parsedAmount);
        await tx.wait();
        updateStatus('Tokens staked successfully!');
    } catch (error) {
        updateStatus('Error staking tokens: ' + error.message);
    }
}

// Claim rewards
async function claimRewards() {
    try {
        const tx = await stakingContract.getReward();
        await tx.wait();
        updateStatus('Rewards claimed successfully!');
    } catch (error) {
        updateStatus('Error claiming rewards: ' + error.message);
    }
}

// Withdraw tokens
async function withdrawTokens() {
    const amountToWithdraw = document.getElementById("withdrawAmount").value;
    if (!amountToWithdraw) {
        updateStatus("Please enter an amount to withdraw.");
        return;
    }
    try {
        const parsedAmount = ethers.utils.parseUnits(amountToWithdraw, 18);  // Assuming 18 decimals
        const tx = await stakingContract.withdraw(parsedAmount);
        await tx.wait();
        updateStatus('Tokens withdrawn successfully!');
    } catch (error) {
        updateStatus('Error withdrawing tokens: ' + error.message);
    }
}
