let provider;
let signer;
let stakingContract;
let erc20ABI;

// Replace with your actual Sepolia contract address
const stakingContractAddress = '0x81db5E2dEFA429C47A37F30e7A5EcD4909d25B3a';

// Helper function to wait for a given amount of time
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry logic function with enhanced error handling and logging
async function retryWithDelay(fn, retries = 3, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed: ${error.message}`);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await wait(delay);
            } else {
                console.error(`Failed after ${retries} attempts: ${error.message}`);
                throw new Error("Failed after multiple attempts.");
            }
        }
    }
}

// Load the ABI from external JSON file (erc20.abi.json)
async function loadERC20ABI() {
    try {
        const response = await fetch('./abi/erc20_abi.json');
        if (!response.ok) throw new Error(`Failed to fetch ERC20 ABI: ${response.status} ${response.statusText}`);
        erc20ABI = await response.json();  
    } catch (error) {
        console.error('Failed to load ERC20 ABI:', error);
        return null;
    }
}

async function loadStakingABI() {
    try {
        const response = await fetch('./abi/staking_abi.json');
        if (!response.ok) throw new Error(`Failed to fetch staking ABI: ${response.status} ${response.statusText}`);
        const abi = await response.json();
        return abi;
    } catch (error) {
        console.error('Failed to load staking ABI:', error);
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

// Connect to MetaMask and explicitly specify Sepolia network with retry logic
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum, {
                name: "sepolia",
                chainId: 11155111  // Sepolia network chain ID
            });

            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();

            const network = await retryWithDelay(async () => await provider.getNetwork(), 3, 5000);
            if (network.chainId !== 11155111) {
                updateStatus('Please connect MetaMask to the Sepolia network.');
                return;
            }

            const address = await signer.getAddress();
            updateStatus('Wallet connected: ' + address);

            // Load both ABIs (staking and ERC20)
            await loadERC20ABI();
            const abi = await retryWithDelay(loadStakingABI, 3, 5000);

            if (abi && erc20ABI) {
                console.log("Loaded ABIs:", { stakingABI: abi, erc20ABI });
                stakingContract = new ethers.Contract(stakingContractAddress, abi, signer);
                console.log("Contract connected:", stakingContract);
                updateDashboard();  // Call this after stakingContract is defined
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

// Update dashboard with user's balances using retry logic
async function updateDashboard() {
    try {
        const stakingBalance = await retryWithDelay(async () => await stakingContract.balances(await signer.getAddress()), 3, 5000);
        document.getElementById("stakingBalance").innerText = ethers.utils.formatUnits(stakingBalance, 18) + " STK";

        const rewardBalance = await retryWithDelay(async () => await stakingContract.rewards(await signer.getAddress()), 3, 5000);
        document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(rewardBalance, 18) + " RWD";

        const walletBalance = await retryWithDelay(async () => await provider.getBalance(await signer.getAddress()), 3, 5000);
        document.getElementById("walletBalance").innerText = ethers.utils.formatUnits(walletBalance, 18) + " ETH";
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Stake tokens with retry logic, balance check, approval, and increased gas limit
async function stakeTokens() {
    const amountToStake = document.getElementById('stakeAmount').value.trim();
    if (!amountToStake || amountToStake === '0') {
        alert('Please enter a valid amount to stake.');
        return;
    }

    try {
        const stakeAmountInWei = ethers.utils.parseUnits(amountToStake, 18);
        console.log("Staking Amount in Wei:", stakeAmountInWei.toString());

        // Fetch the staking token address from the staking contract
        const stakingTokenAddress = await retryWithDelay(async () => await stakingContract.stakingToken(), 3, 5000);
        console.log("Staking Token Address from contract:", stakingTokenAddress);

        if (!stakingTokenAddress) {
            throw new Error("Failed to fetch staking token address.");
        }

        const tokenContract = new ethers.Contract(stakingTokenAddress, erc20ABI, signer);

        // Check user balance before staking
        const userBalance = await retryWithDelay(async () => await tokenContract.balanceOf(await signer.getAddress()), 3, 5000);
        console.log("User Token Balance:", userBalance.toString());
        if (userBalance.lt(stakeAmountInWei)) {
            alert("Insufficient tokens for staking.");
            return;
        }

        // Check the allowance
        const allowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);
        if (allowance.lt(stakeAmountInWei)) {
            // Approve staking contract to spend tokens
            const approvalTx = await retryWithDelay(() => tokenContract.approve(stakingContract.address, stakeAmountInWei), 3, 5000);
            await approvalTx.wait();
            console.log("Tokens approved for staking.");
        }

        // Proceed to stake tokens after approval, increase gas limit and fees
        const tx = await retryWithDelay(() => stakingContract.stake(stakeAmountInWei, {
            gasLimit: 2000000,  // Increase gas limit
            maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),  // Adjust for network conditions
            maxPriorityFeePerGas: ethers.utils.parseUnits('5', 'gwei')
        }), 3, 5000);
        await tx.wait();
        console.log('Successfully staked:', amountToStake);
        alert(`Successfully staked ${amountToStake} tokens!`);

        updateDashboard();
    } catch (error) {
        console.error("Error staking tokens:", error);  // Logs entire error object
        if (error.data) {
            console.error("Error Data:", error.data);
        }
        alert(`Error staking tokens: ${error.message}`);
    }
}



// Claim rewards with retry logic
async function claimRewards() {
    showLoadingSpinner('claimSpinner', true);
    try {
        const tx = await retryWithDelay(() => stakingContract.getReward(), 3, 5000);
        await tx.wait();
        updateStatus('Rewards claimed successfully!');
        updateDashboard();
    } catch (error) {
        updateStatus('Error claiming rewards: ' + error.message);
    } finally {
        showLoadingSpinner('claimSpinner', false);
    }
}

// Withdraw tokens with retry logic
async function withdrawTokens() {
    const amountToWithdraw = document.getElementById("withdrawAmount").value;
    if (!amountToWithdraw) {
        updateStatus("Please enter an amount to withdraw.");
        return;
    }
    showLoadingSpinner('withdrawSpinner', true);
    try {
        const parsedAmount = ethers.utils.parseUnits(amountToWithdraw, 18);
        const tx = await retryWithDelay(() => stakingContract.withdraw(parsedAmount), 3, 5000);
        await tx.wait();
        updateStatus('Tokens withdrawn successfully!');
        updateDashboard();
    } catch (error) {
        updateStatus('Error withdrawing tokens: ' + error.message);
    } finally {
        showLoadingSpinner('withdrawSpinner', false);
    }
}
