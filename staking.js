let provider;
let signer;
let stakingContract;
const sepoliaChainId = 11155111;
const localhostChainId = 31337;

// Contract addresses for different networks
const contractAddresses = {
    //sepolia: '0x56D2caa1B5E42614764a9F1f71D6DbfFd66487a4',
    localhost: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E'     // Replace this address with the actual staking contract address
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
        const stakingAbi = await loadStakingABI();
        stakingContract = new ethers.Contract(contractAddress, stakingAbi, signer);
        console.log("Staking contract initialized on address:", contractAddress);
    } catch (error) {
        showNotification('Failed to initialize staking contract: ' + error.message, 'error');
    }
}

// Update dashboard with user's balances and APY
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

        const erc20ABI = await loadERC20ABI();
        if (!erc20ABI) return;

        const stakingTokenAddress = await stakingContract.stakingToken();
        const tokenContract = new ethers.Contract(stakingTokenAddress, erc20ABI, signer);

        const userBalance = await tokenContract.balanceOf(await signer.getAddress());
        if (userBalance.lt(stakeAmountInWei)) {
            showNotification("Insufficient tokens for staking.", "error");
            return;
        }

        const allowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);

        if (allowance.lt(stakeAmountInWei)) {
            console.log ("Current allowance amount :", ethers.utils.formatUnits(allowance, 18));

        
        // Verify Token Address Consistency
        const stakingTokenAddress = await stakingContract.stakingToken();
        console.log("Staking Token Address:", stakingTokenAddress);

        const erc20TokenAddress = tokenContract.address;
        console.log("ERC20 Token Address:", erc20TokenAddress);

        if (stakingTokenAddress !== erc20TokenAddress) {
            console.error("Token address mismatch! Approving wrong contract.");
        }
        // ends here




            const approvalTx = await tokenContract.approve(stakingContract.address, stakeAmountInWei);
            console.log("Approval transaction sent", approvalTx);

            const receipt = await approvalTx.wait();
            console.log ("Approval transaction confirmed :", receipt);

            const UpdatedAllowance = await tokenContract.allowance(await signer.getAddress(), stakingContract.address);
            console.log("Updated Allowance:", ethers.utils.formatUnits(UpdatedAllowance, 18));
        }
        /* manual gas settings 
        const tx = await stakingContract.stake(stakeAmountInWei, {
            gasLimit: 2000000,
            maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
            maxPriorityFeePerGas: ethers.utils.parseUnits('5', 'gwei')
        });
        */

        const tx = await stakingContract.stake(stakeAmountInWei);

        await tx.wait();
        showNotification(`Successfully staked ${amountToStake} tokens!`, 'success');
        updateDashboard();
    } catch (error) {
        console.error('Error staking tokens:', error);
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

