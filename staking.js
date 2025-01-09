let provider;
let signer;
let stakingContract;
const sepoliaChainId = 11155111;
const localhostChainId = 31337;

// Contract addresses for different networks
const contractAddresses = {
    //sepolia: '0x56D2caa1B5E42614764a9F1f71D6DbfFd66487a4',
    localhost: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'    // Replace this address with the actual staking contract address (logged in 1_deploy_staking.js)
    // don't forget to load the abi json :  cp artifacts/contracts/Staking.sol/Staking.json abi/staking_abi.json
};

// Function to show notifications at the bottom-right of the screen
function showNotification(message, type = 'success') {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notificationMessage");

    // Set the message and type (success or error)
    notificationMessage.innerText = message;
    notification.classList.remove("hidden");
    
    if (type === 'success') {
        notification.classList.add("success");
        notification.classList.remove("error");
    } else if (type === 'error') {
        notification.classList.add("error");
        notification.classList.remove("success");
    }

    // Display notification with animation
    notification.classList.add("show");

    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById("notification");
    notification.classList.remove("show");
}

// Auto-refresh dashboard every 10 seconds
setInterval(async () => {
    if (signer && stakingContract) {
        await updateDashboard();
    }
}, 10000); // Updates every 10 seconds


// Function to update connection status on the top-right of the screen
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

// Connect to MetaMask and detect network
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const address = await signer.getAddress();
            updateConnectionStatus(address);

            const network = await provider.getNetwork();
            console.log(`Connected to network: ${network.chainId}`);

            if (network.chainId === sepoliaChainId) {
                await initializeStakingContract(contractAddresses.sepolia);
            } else if (network.chainId === localhostChainId) {
                await initializeStakingContract(contractAddresses.localhost);
            } else {
                showNotification('Please switch to Sepolia or Localhost (Hardhat).', 'error');
                return;
            }

            updateDashboard();
        } catch (error) {
            showNotification('Error connecting wallet: ' + error.message, 'error');
        }
    } else {
        showNotification('MetaMask not found. Please install it.', 'error');
    }
}

async function initializeStakingContract(contractAddress) {
    try {
        const stakingAbiJson = await loadStakingABI();
        
        if (!stakingAbiJson) {
            throw new Error('Failed to load ABI JSON.');
        }

        const stakingAbi = stakingAbiJson.abi;
        if (!Array.isArray(stakingAbi)) {
            throw new Error('ABI is not a valid array.');
        }

        if (!signer) {
            throw new Error('Signer is not initialized. Connect the wallet first.');
        }

        console.log("Loading ABI:", stakingAbi); // Debug ABI
        console.log("Using Address:", contractAddress); // Debug address

        stakingContract = new ethers.Contract(contractAddress, stakingAbi, signer);
        console.log("Staking contract initialized on address:", contractAddress);

        return stakingContract; // Return the instance if needed
    } catch (error) {
        console.error('Failed to initialize staking contract:', error);
        showNotification('Failed to initialize staking contract: ' + error.message, 'error');
    }
}


async function updateDashboard() {
    try {
        if (!stakingContract) {
            showNotification("Please connect the wallet to load contract data.", "error");
            return;
        }

        // Fetch balances
        const stakingBalance = await stakingContract.balances(await signer.getAddress());
        document.getElementById("stakingBalance").innerText = ethers.utils.formatUnits(stakingBalance, 18) + " STK";

        const rewardBalance = await stakingContract.earned(await signer.getAddress());
        document.getElementById("rewardBalance").innerText = ethers.utils.formatUnits(rewardBalance, 18) + " RWD";

        const walletBalance = await provider.getBalance(await signer.getAddress(), "latest");
        document.getElementById("walletBalance").innerText = ethers.utils.formatUnits(walletBalance, 18) + " ETH";

        // APY Calculation
        const rewardRate = await stakingContract.rewardRate();
        const totalStaked = await stakingContract.totalSupply();

        // Check values
        console.log("Reward Rate:", ethers.utils.formatUnits(rewardRate, 18));
        console.log("Total Staked:", ethers.utils.formatUnits(totalStaked, 18));

        if (rewardRate.isZero() || totalStaked.isZero()) {
            document.getElementById("apyValue").innerText = "0.00%";
            return;
        }

        // Approximation for Ethereum blocks per year (15 seconds per block)
        const blocksPerYear = (365 * 24 * 60 * 60) / 15;
        const yearlyRewards = rewardRate.mul(blocksPerYear);

        const apy = yearlyRewards.mul(10000).div(totalStaked); // Multiply by 10000 for precision

        // Update APY display
        document.getElementById("apyValue").innerText = apy.gt(0) ? (apy / 100).toFixed(2) + "%" : "0.01%"; // Show minimum APY

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

// Stake tokens
async function stakeTokens() {
    if (!stakingContract) {
        console.error('Staking contract not defined.');
        showNotification('Error: stakingContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    const amountToStake = document.getElementById('stakeAmount').value.trim();
    if (!amountToStake || amountToStake === '0') {
        showNotification('Please enter a valid amount to stake.', 'error');
        return;
    }

    try {
        const stakeAmountInWei = ethers.utils.parseUnits(amountToStake, 18);

        // Load the ERC20 ABI
        const erc20ABI = await loadERC20ABI();
        if (!erc20ABI) {
            showNotification('Failed to load ERC20 ABI.', 'error');
            return;
        }

        const stakingTokenAddress = await stakingContract.stakingToken();
        const tokenContract = new ethers.Contract(stakingTokenAddress, erc20ABI, signer);

        // Check user token balance
        const userBalance = await tokenContract.balanceOf(await signer.getAddress());
        console.log("User Balance:", ethers.utils.formatUnits(userBalance, 18));
        if (userBalance.lt(stakeAmountInWei)) {
            showNotification("Insufficient tokens for staking.", 'error');
            return;
        }

        // Check the allowance
        let allowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);
        console.log("Current Allowance:", ethers.utils.formatUnits(allowance, 18));

        if (allowance.lt(stakeAmountInWei)) {
            try {
                const approvalTx = await tokenContract.approve(stakingContract.address, stakeAmountInWei);
                await approvalTx.wait();
                console.log("Approval confirmed.");
            } catch (error) {
                console.error("Approval failed:", error);
                showNotification(`Approval error: ${error.message}`, 'error');
                return;
            }
        }

        // Validate the stake with callStatic
        try {
            await stakingContract.callStatic.stake(stakeAmountInWei);
            console.log("Stake callStatic succeeded.");
        } catch (error) {
            console.error("Stake callStatic failed:", error);
            showNotification(`Stake error: ${error.message}`, 'error');
            return;
        }

        // Estimate gas and execute the stake
        const gasEstimate = await stakingContract.estimateGas.stake(stakeAmountInWei);
        console.log("Gas Estimate:", gasEstimate.toString());

        const tx = await stakingContract.stake(stakeAmountInWei, {
            gasLimit: gasEstimate.add(50000),
        });
        await tx.wait();
        showNotification(`Successfully staked ${amountToStake} tokens!`, 'success');
        updateDashboard();
    } catch (error) {
        console.error('Error during staking process:', error);
        showNotification(`Error staking tokens: ${error.message}`, 'error');
    }
}








// Stake LP tokens (uses the same STK token contract)
async function stakeLPTokens() {
    if (!stakingContract) {
        showNotification('Error: stakingContract is undefined. Please connect your wallet.', 'error');
        return;
    }

    const amountToStake = document.getElementById('lpStakeAmount').value.trim();
    if (!amountToStake || amountToStake === '0') {
        showNotification('Please enter a valid amount to stake.', 'error');
        return;
    }

    try {
        const stakeAmountInWei = ethers.utils.parseUnits(amountToStake, 18);

        // Reuse the same ERC20 ABI and staking token contract
        const erc20ABI = await loadERC20ABI();
        if (!erc20ABI) return;

        const stakingTokenAddress = await stakingContract.stakingToken();
        const tokenContract = new ethers.Contract(stakingTokenAddress, erc20ABI, signer);

        // Check user token balance
        const balance = await tokenContract.balanceOf(await signer.getAddress());
        console.log("Token Balance:", ethers.utils.formatUnits(balance, 18));

        const userBalance = await tokenContract.balanceOf(await signer.getAddress());
        if (userBalance.lt(stakeAmountInWei)) {
            showNotification("Insufficient tokens for staking.", 'error');
            return;
        }

        const allowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);
        if (allowance.lt(stakeAmountInWei)) {
            const approvalTx = await tokenContract.approve(stakingContract.address, stakeAmountInWei);
            await approvalTx.wait();
            console.log("Updated Allowance:", ethers.utils.formatUnits(await tokenContract.allowance(await signer.getAddress(), stakingContract.address), 18));
        }

        const tx = await stakingContract.stakeLP(stakeAmountInWei);
        await tx.wait();
        showNotification(`Successfully staked ${amountToStake} LP tokens!`, 'success');
        updateDashboard();
    } catch (error) {
        console.error('Error staking LP tokens:', error);
        showNotification(`Error staking LP tokens: ${error.message}`, 'error');
    }
}

// Withdraw tokens
async function withdrawTokens() {
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

// Function to update the selected reward amount when the slider changes
function updateRewardAmount() {
    const rewardSlider = document.getElementById('rewardSlider');
    const selectedReward = document.getElementById('selectedReward');
    const maxReward = parseFloat(document.getElementById('rewardBalance').innerText.split(' ')[0]);

    // Update the slider max value to the maximum available rewards
    rewardSlider.max = maxReward;

    // Update the selected reward display
    selectedReward.innerText = `${rewardSlider.value} RWD`;
}

// Update the claim rewards function to use the slider value
async function claimRewards() {
    try {
        const rewardAmount = document.getElementById('rewardSlider').value;
        if (rewardAmount <= 0) {
            showNotification('Please select a valid reward amount.', 'error');
            return;
        }

        const rewardAmountInWei = ethers.utils.parseUnits(rewardAmount.toString(), 18);
        const tx = await stakingContract.getReward(rewardAmountInWei);
        await tx.wait();
        showNotification(`Successfully claimed ${rewardAmount} rewards!`, 'success');
        updateDashboard();
    } catch (error) {
        showNotification(`Error claiming rewards: ${error.message}`, 'error');
    }
}

async function ClaimAllStakingRewards() {
    try {
        if (!stakingContract) {
            showNotification('Staking contract not connected. Please connect your wallet.', 'error');
            return;
        }

        // Claim all rewards from the contract
        const earned = await stakingContract.earned(await signer.getAddress());
        if (earned.eq(0)) {
            showNotification('No rewards available to claim.', 'error');
            return;
        }

        const tx = await stakingContract.getReward();
        await tx.wait();

        await tx.wait();

        showNotification('All rewards claimed successfully!', 'success');

        // Update dashboard to reflect changes
        await updateDashboard();
    } catch (error) {
        console.error('Error claiming all rewards:', error);
        showNotification(`Error claiming rewards: ${error.message}`, 'error');
    }
}

function updateSelectedPercentage() {
    const slider = document.getElementById('percentageSlider');
    const percentage = slider.value;

    // Update the displayed percentage
    document.getElementById('selectedPercentage').innerText = percentage + "%";

    // Ensure gradient only covers up to the thumb
    const fillPercentage = (percentage - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #00b4d8 ${fillPercentage}%, #ccc ${fillPercentage}%)`;
}


// Initialize slider style on load
window.onload = () => {
    const slider = document.getElementById('percentageSlider');
    slider.style.background = `linear-gradient(to right, #00b4d8 0%, #ccc 0%)`;
    slider.value = 10;
    updateSelectedPercentage();
};





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

