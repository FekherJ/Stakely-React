let provider;
let signer;
let stakingContract;
const sepoliaChainId = 11155111;
const localhostChainId = 31337;

// Contract addresses for different networks
const contractAddresses = {
    sepolia: '0x56D2caa1B5E42614764a9F1f71D6DbfFd66487a4',  // Sepolia contract address
    localhost: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'  // Localhost (Hardhat) contract address
};

// Function to show notifications at the bottom-right of the screen
function showNotification(message, type = 'success') {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notificationMessage");

    notificationMessage.innerText = message;
    notification.classList.remove("hidden");

    if (type === 'success') {
        notification.classList.add("success");
        notification.classList.remove("error");
    } else if (type === 'error') {
        notification.classList.add("error");
        notification.classList.remove("success");
    }

    // Auto-hide after 5 seconds
    setTimeout(hideNotification, 5000);
}

function hideNotification() {
    const notification = document.getElementById("notification");
    notification.classList.add("hidden");
}

// Function to update connection status on the top-right of the screen
function updateConnectionStatus(address = null) {
    const connectionStatus = document.getElementById("connectionStatus");
    if (address) {
        connectionStatus.innerText = `Connected: ${address}`;
    } else {
        connectionStatus.innerText = "Not connected";
    }
}

// Connect to MetaMask and detect network
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const address = await signer.getAddress();
            updateConnectionStatus(address);

            // Detect network
            const network = await provider.getNetwork();
            console.log(`Connected to network: ${network.chainId}`);

            // Dynamically handle different networks
            if (network.chainId === sepoliaChainId) {
                await initializeStakingContract(contractAddresses.sepolia);
                console.log("Connected to Sepolia network.");
            } else if (network.chainId === localhostChainId) {
                await initializeStakingContract(contractAddresses.localhost);
                console.log("Connected to Localhost (Hardhat) network.");
            } else {
                showNotification('Please switch to Sepolia or Localhost (Hardhat).', 'error');
                return;
            }

            updateDashboard();
        } catch (error) {
            showNotification('Error connecting wallet: ' + error.message, 'error');
        }
    } else {
        showNotification('MetaMask not found. Please install it to interact with the contract.', 'error');
    }
}

// Initialize the staking contract with the correct ABI and address
async function initializeStakingContract(contractAddress) {
    try {
        // Load contract ABI and initialize
        const stakingAbi = await loadStakingABI();
        stakingContract = new ethers.Contract(contractAddress, stakingAbi, signer);
        console.log("Staking contract initialized on address:", contractAddress);
    } catch (error) {
        showNotification('Failed to initialize staking contract: ' + error.message, 'error');
    }
}

// Update dashboard with user's balances
async function updateDashboard() {
    try {
        if (!stakingContract) {
            showNotification("Please connect the wallet to load contract data.", "error");
            return;
        }

        const stakingBalance = await stakingContract.balances(await signer.getAddress());
        document.getElementById("stakingBalance").innerText = ethers.utils.formatUnits(stakingBalance, 18) + " STK";

        const rewardBalance = await stakingContract.rewards(await signer.getAddress());
        document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(rewardBalance, 18) + " RWD";

        const walletBalance = await provider.getBalance(await signer.getAddress());
        document.getElementById("walletBalance").innerText = ethers.utils.formatUnits(walletBalance, 18) + " ETH";
    } catch (error) {
        showNotification('Error updating dashboard: ' + error.message, 'error');
    }
}

// Load the ABI for the staking contract
async function loadStakingABI() {
    try {
        const response = await fetch('./abi/staking_abi.json');
        if (!response.ok) throw new Error(`Failed to fetch staking ABI: ${response.status} ${response.statusText}`);
        const abi = await response.json();
        return abi;
    } catch (error) {
        showNotification('Failed to load staking ABI: ' + error.message, 'error');
        return null;
    }
}

// Load the ERC20 ABI for interacting with the staking token
async function loadERC20ABI() {
    try {
        const response = await fetch('./abi/erc20_abi.json');
        if (!response.ok) throw new Error(`Failed to fetch ERC20 ABI: ${response.status} ${response.statusText}`);
        const abi = await response.json();
        return abi;
    } catch (error) {
        showNotification('Failed to load ERC20 ABI: ' + error.message, 'error');
        return null;
    }
}

// Stake tokens function
async function stakeTokens() {
    if (!stakingContract) {
        console.error('Staking contract not defined.');
        showNotification('Error: stakingContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    const amountToStake = document.getElementById('stakeAmount').value.trim();
    console.log("Amount to stake:", amountToStake);

    if (!amountToStake || amountToStake === '0') {
        showNotification('Please enter a valid amount to stake.', 'error');
        return;
    }

    try {
        const stakeAmountInWei = ethers.utils.parseUnits(amountToStake, 18);
        console.log("Stake amount in wei:", stakeAmountInWei);

        // Load the ERC20 ABI for staking tokens
        const erc20ABI = await loadERC20ABI();
        if (!erc20ABI) return; // Handle ABI loading error

        const stakingTokenAddress = await stakingContract.stakingToken();
        console.log("Staking token address:", stakingTokenAddress);

        const tokenContract = new ethers.Contract(stakingTokenAddress, erc20ABI, signer);
        const userBalance = await tokenContract.balanceOf(await signer.getAddress());
        console.log("User balance:", userBalance.toString());

        if (userBalance.lt(stakeAmountInWei)) {
            showNotification("Insufficient tokens for staking.", "error");
            return;
        }

        const allowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);
        console.log("Allowance:", allowance.toString());

        if (allowance.lt(stakeAmountInWei)) {
            console.log("Approving tokens...");
            const approvalTx = await tokenContract.approve(stakingContract.address, stakeAmountInWei);
            await approvalTx.wait();
        }

        console.log("Staking tokens...");
        const tx = await stakingContract.stake(stakeAmountInWei, {
            gasLimit: 2000000,
            maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
            maxPriorityFeePerGas: ethers.utils.parseUnits('5', 'gwei')
        });
        await tx.wait();
        console.log("Tokens staked successfully.");
        showNotification(`Successfully staked ${amountToStake} tokens!`, 'success');
        updateDashboard();
    } catch (error) {
        console.error('Error staking tokens:', error);
        showNotification(`Error staking tokens: ${error.message}`, 'error');
    }
}

// Withdraw tokens
async function withdrawTokens() {
    if (!stakingContract) {
        showNotification('Error: stakingContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    const amountToWithdraw = document.getElementById("withdrawAmount").value;
    if (!amountToWithdraw) {
        showNotification("Please enter an amount to withdraw.", 'error');
        return;
    }
    
    try {
        const parsedAmount = ethers.utils.parseUnits(amountToWithdraw, 18);
        const tx = await stakingContract.withdraw(parsedAmount);
        await tx.wait();
        showNotification('Tokens withdrawn successfully!', 'success');
        updateDashboard();
    } catch (error) {
        showNotification(`Error withdrawing tokens: ${error.message}`, 'error');
    }
}

// Claim rewards using the staking contract directly
async function claimRewards() {
    if (!stakingContract) {
        showNotification('Error: stakingContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    try {
        const tx = await stakingContract.getReward();  // Use the staking contract's getReward() method
        await tx.wait();
        showNotification('Rewards claimed successfully!', 'success');
        updateDashboard();
    } catch (error) {
        showNotification(`Error claiming rewards: ${error.message}`, 'error');
    }
}
