let provider;
let signer;
let liquidityPoolContract;
const sepoliaChainId = 11155111;
const localhostChainId = 31337;

console.log("LiquidityPools script loaded");


// Contract addresses for different networks
const contractAddresses = {
    sepolia: '0x<your_liquidity_pool_contract_address_on_sepolia>',
    localhost: '0xA4899D35897033b927acFCf422bc745916139776'
};

async function initLiquidityPool() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const network = await provider.getNetwork();
            console.log(`Connected to network: ${network.chainId}`);

            if (network.chainId === sepoliaChainId) {
                await initializeLiquidityPoolContract(contractAddresses.sepolia);
            } else if (network.chainId === localhostChainId) {
                await initializeLiquidityPoolContract(contractAddresses.localhost);
            } else {
                showNotification('Please switch to Sepolia or Localhost (Hardhat).', 'error');
                return;
            }
        } catch (error) {
            showNotification('Error connecting wallet: ' + error.message, 'error');
        }
    } else {
        showNotification('MetaMask not found. Please install it.', 'error');
    }
}

async function initializeLiquidityPoolContract(contractAddress) {
    try {
        const liquidityPoolAbi = await loadLiquidityPoolABI();
        liquidityPoolContract = new ethers.Contract(contractAddress, liquidityPoolAbi, signer);
        console.log("Liquidity Pool contract initialized at address:", contractAddress);
    } catch (error) {
        showNotification('Failed to initialize liquidity pool contract: ' + error.message, 'error');
    }
}

async function loadLiquidityPoolABI() {
    const response = await fetch('./abi/liquiditypool_abi.json');
    if (!response.ok) throw new Error(`Failed to load ABI: ${response.statusText}`);
    return await response.json();
}

async function depositLiquidity() {
    const ethAmount = document.getElementById('lpAmount').value;
    if (!ethAmount) {
        showNotification('Please enter an amount to deposit liquidity', 'error');
        return;
    }

    const stkAmount = ethAmount * 100; // STK should be 100 times the ETH amount

    try {
        const tx = await liquidityPoolContract.depositLiquidity(ethAmount, stkAmount, {
            value: ethers.utils.parseUnits(ethAmount, 'ether') // Send ETH with the transaction
        });
        await tx.wait();
        showNotification(`Deposited ${ethAmount} ETH and ${stkAmount} STK into the liquidity pool!`, 'success');
    } catch (error) {
        console.error("Error depositing liquidity:", error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function withdrawLiquidity() {
    const ethAmount = document.getElementById('lpAmount').value;
    if (!ethAmount) {
        showNotification('Please enter an amount to withdraw liquidity', 'error');
        return;
    }

    try {
        const tx = await liquidityPoolContract.withdrawLiquidity(ethers.utils.parseUnits(ethAmount, 'ether'));
        await tx.wait();
        showNotification(`Withdrew ${ethAmount} ETH from the liquidity pool!`, 'success');
    } catch (error) {
        console.error("Error withdrawing liquidity:", error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function claimRewards() {
    try {
        const tx = await liquidityPoolContract.claimRewards();
        await tx.wait();
        showNotification('Rewards claimed successfully!', 'success');
    } catch (error) {
        console.error("Error claiming rewards:", error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Initialize the contract on page load
initLiquidityPool();
