let provider;
let signer;
let liquidityContract;
const localhostChainId = 31337;
const sepoliaChainId = 11155111;

// Contract addresses for different networks
const liquidityContractAddresses = {
    sepolia: '0xYourSepoliaLiquidityContractAddress',
    localhost: '0x9A676e781A523b5d0C0e43731313A708CB607508'
};

// Connect to MetaMask and initialize liquidity contract
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const address = await signer.getAddress();
            updateConnectionStatus(address);

            const network = await provider.getNetwork();
            if (network.chainId === sepoliaChainId) {
                await initializeLiquidityContract(liquidityContractAddresses.sepolia);
            } else if (network.chainId === localhostChainId) {
                await initializeLiquidityContract(liquidityContractAddresses.localhost);
            } else {
                showNotification('Please switch to Sepolia or Localhost (Hardhat).', 'error');
                return;
            }

            updateLPDashboard();
        } catch (error) {
            showNotification('Error connecting wallet: ' + error.message, 'error');
        }
    } else {
        showNotification('MetaMask not found. Please install it.', 'error');
    }
}

// Initialize the liquidity contract
async function initializeLiquidityContract(contractAddress) {
    try {
        const liquidityAbi = await loadLiquidityABI();
        liquidityContract = new ethers.Contract(contractAddress, liquidityAbi, signer);
        console.log("Liquidity contract initialized on address:", contractAddress);
    } catch (error) {
        showNotification('Failed to initialize liquidity contract: ' + error.message, 'error');
    }
}

// Load the ABI for the liquidity contract
async function loadLiquidityABI() {
    try {
        const response = await fetch('./abi/liquidity_abi.json');
        if (!response.ok) throw new Error(`Failed to fetch liquidity ABI: ${response.status} ${response.statusText}`);
        const abi = await response.json();
        return abi;
    } catch (error) {
        showNotification('Failed to load liquidity ABI: ' + error.message, 'error');
        return null;
    }
}

// Initialize Rewards Slider
async function initializeSlider() {
    try {
        const rewardBalance = await liquidityContract.rewards(await signer.getAddress());
        const formattedBalance = ethers.utils.formatUnits(rewardBalance, 18);

        // Set slider max based on fetched balance
        const slider = document.getElementById('rewardSlider');
        slider.max = parseFloat(formattedBalance) || 0; // Default 0 if invalid
        slider.value = 0;

        // Update displayed reward
        document.getElementById('selectedReward').innerText = '0 RWD';
    } catch (error) {
        console.error('Error initializing slider:', error);
    }
}


// Deposit liquidity
async function depositLiquidity() {
    if (!liquidityContract) {
        showNotification('Error: liquidityContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    const amountToDeposit = document.getElementById('lpAmount').value.trim();
    if (!amountToDeposit || amountToDeposit === '0') {
        showNotification('Please enter a valid amount to deposit.', 'error');
        return;
    }

    try {
        const depositAmountInWei = ethers.utils.parseUnits(amountToDeposit, 18);
        const tx = await liquidityContract.deposit(depositAmountInWei);
        await tx.wait();
        showNotification(`Successfully deposited ${amountToDeposit} ETH into the liquidity pool!`, 'success');
        updateLPDashboard();
    } catch (error) {
        console.error('Error depositing liquidity:', error);
        showNotification(`Error depositing liquidity: ${error.message}`, 'error');
    }
}

// Claim LP rewards
async function claimLPRewards() {
    if (!liquidityContract) {
        showNotification('Error: liquidityContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    try {
        const rewardAmount = document.getElementById('rewardSlider').value;
        if (rewardAmount === '0') {
            showNotification('Please select a valid reward amount to claim.', 'error');
            return;
        }

        const amountInWei = ethers.utils.parseUnits(rewardAmount, 18);
        const tx = await liquidityContract.claimRewards(amountInWei);
        await tx.wait();
        showNotification(`${rewardAmount} RWD claimed successfully!`, 'success');

        // Refresh slider and dashboard
        await updateLPDashboard();
        await initializeSlider();
    } catch (error) {
        console.error('Error claiming LP rewards:', error);
        showNotification(`Error claiming LP rewards: ${error.message}`, 'error');
    }
}


// Update the liquidity pool dashboard
async function updateLPDashboard() {
    try {
        if (!liquidityContract) {
            showNotification("Please connect the wallet to load contract data.", "error");
            return;
        }

        const walletBalance = await provider.getBalance(await signer.getAddress());
        document.getElementById("walletBalance").innerText = ethers.utils.formatUnits(walletBalance, 18) + " ETH";

        const lpBalance = await liquidityContract.balanceOf(await signer.getAddress());
        document.getElementById("lpBalance").innerText = ethers.utils.formatUnits(lpBalance, 18) + " LP";

        const rewardBalance = await liquidityContract.rewards(await signer.getAddress());
        document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(rewardBalance, 18) + " RWD";

        initializeSlider();
    } catch (error) {
        showNotification('Error updating liquidity dashboard: ' + error.message, 'error');
    }
}

// Update connection status
function updateConnectionStatus(address = null) {
    const connectionStatus = document.getElementById("connectionStatus");
    if (connectionStatus) {
        connectionStatus.innerText = address ? `Connected: ${address}` : "Not connected";
    }
}
