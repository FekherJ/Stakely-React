// liquiditypools.js - JavaScript for Liquidity Pools Management

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

// Withdraw liquidity
async function withdrawLiquidity() {
    if (!liquidityContract) {
        showNotification('Error: liquidityContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    const amountToWithdraw = document.getElementById('lpAmount').value.trim();
    if (!amountToWithdraw || amountToWithdraw === '0') {
        showNotification('Please enter a valid amount to withdraw.', 'error');
        return;
    }

    try {
        const withdrawAmountInWei = ethers.utils.parseUnits(amountToWithdraw, 18);
        const tx = await liquidityContract.withdraw(withdrawAmountInWei);
        await tx.wait();
        showNotification(`Successfully withdrew ${amountToWithdraw} ETH from the liquidity pool!`, 'success');
        updateLPDashboard();
    } catch (error) {
        console.error('Error withdrawing liquidity:', error);
        showNotification(`Error withdrawing liquidity: ${error.message}`, 'error');
    }
}

// Claim LP rewards
async function claimLPRewards() {
    if (!liquidityContract) {
        showNotification('Error: liquidityContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    try {
        const tx = await liquidityContract.claimRewards();
        await tx.wait();
        showNotification('LP Rewards claimed successfully!', 'success');
        updateLPDashboard();
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
        document.getElementById("lpRewardBalance").innerText = ethers.utils.formatUnits(rewardBalance, 18) + " RWD";
    } catch (error) {
        showNotification('Error updating liquidity dashboard: ' + error.message, 'error');
    }
}

// Update connection status on the top-right of the screen
function updateConnectionStatus(address = null) {
    const connectionStatus = document.getElementById("connectionStatus");
    if (connectionStatus) {
        if (address) {
            connectionStatus.innerText = `Connected: ${address}`;
        } else {
            connectionStatus.innerText = "Not connected";
        }
    } else {
        console.error("Connection status element is missing from the DOM.");
    }
}
