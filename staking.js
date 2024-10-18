let provider;
let signer;
let stakingContract;

const stakingContractAddress = '0xYourActualContractAddress';  // Replace with your actual Sepolia contract address

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

// Show/Hide loading spinner
function showLoadingSpinner(buttonId, show) {
    const spinner = document.getElementById(buttonId);
    spinner.style.display = show ? 'inline-block' : 'none';
}

// Connect to MetaMask and explicitly specify Sepolia network
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum, {
                name: "sepolia",
                chainId: 11155111  // Sepolia network chain ID
            });

            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();

            const network = await provider.getNetwork();
            if (network.chainId !== 11155111) {
                updateStatus('Please connect MetaMask to the Sepolia network.');
                return;
            }

            const address = await signer.getAddress();
            updateStatus('Wallet connected: ' + address);
            updateDashboard();

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

// Update dashboard with user's balances
async function updateDashboard() {
    try {
        const stakingBalance = await stakingContract.balances(await signer.getAddress());
        document.getElementById("stakingBalance").innerText = ethers.utils.formatUnits(stakingBalance, 18) + " STK";

        const rewardBalance = await stakingContract.rewards(await signer.getAddress());
        document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(rewardBalance, 18) + " RWD";

        const walletBalance = await provider.getBalance(await signer.getAddress());
        document.getElementById("walletBalance").innerText = ethers.utils.formatUnits(walletBalance, 18) + " ETH";
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Stake tokens
async function stakeTokens() {
    const amountToStake = document.getElementById("stakeAmount").value;
    if (!amountToStake) {
        updateStatus("Please enter an amount to stake.");
        return;
    }
    showLoadingSpinner('stakeSpinner', true);
    try {
        const parsedAmount = ethers.utils.parseUnits(amountToStake, 18);
        const tx = await stakingContract.stake(parsedAmount);
        await tx.wait();
        updateStatus('Tokens staked successfully!');
        updateDashboard();
    } catch (error) {
        updateStatus('Error staking tokens: ' + error.message);
    } finally {
        showLoadingSpinner('stakeSpinner', false);
    }
}

// Claim rewards
async function claimRewards() {
    showLoadingSpinner('claimSpinner', true);
    try {
        const tx = await stakingContract.getReward();
        await tx.wait();
        updateStatus('Rewards claimed successfully!');
        updateDashboard();
    } catch (error) {
        updateStatus('Error claiming rewards: ' + error.message);
    } finally {
        showLoadingSpinner('claimSpinner', false);
    }
}

// Withdraw tokens
async function withdrawTokens() {
    const amountToWithdraw = document.getElementById("withdrawAmount").value;
    if (!amountToWithdraw) {
        updateStatus("Please enter an amount to withdraw.");
        return;
    }
    showLoadingSpinner('withdrawSpinner', true);
    try {
        const parsedAmount = ethers.utils.parseUnits(amountToWithdraw, 18);
        const tx = await stakingContract.withdraw(parsedAmount);
        await tx.wait();
        updateStatus('Tokens withdrawn successfully!');
        updateDashboard();
    } catch (error) {
        updateStatus('Error withdrawing tokens: ' + error.message);
    } finally {
        showLoadingSpinner('withdrawSpinner', false);
    }
}
