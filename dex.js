let provider, signer, dexContract;
const dexContractAddress = "0xYourDEXContractAddress"; // Replace with actual deployed address

// DEX Contract ABI (simplified)
const dexAbi = [
    "function getAvailableTokens() view returns (address[])",
    "function swap(address tokenIn, address tokenOut, uint256 amountIn)"
];

// Connect wallet and initialize DEX contract
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        dexContract = new ethers.Contract(dexContractAddress, dexAbi, signer);
    }
}

// Fetch token pairs for the dropdown
async function loadTokenPairs() {
    const tokens = await dexContract.getAvailableTokens();
    populateDropdown('tokenIn', tokens);
    populateDropdown('tokenOut', tokens);
    populateDropdown('lpToken1', tokens);
    populateDropdown('lpToken2', tokens);
}

function populateDropdown(dropdownId, tokens) {
    const dropdown = document.getElementById(dropdownId);
    tokens.forEach(token => {
        const option = document.createElement("option");
        option.value = token;
        option.textContent = token;
        dropdown.appendChild(option);
    });
}

// Execute a token swap
async function swapTokens() {
    const amountIn = document.getElementById('amountIn').value;
    const tokenIn = document.getElementById('tokenIn').value;
    const tokenOut = document.getElementById('tokenOut').value;

    if (amountIn && tokenIn && tokenOut) {
        const amountInWei = ethers.utils.parseUnits(amountIn, 18);
        const tx = await dexContract.swap(tokenIn, tokenOut, amountInWei);
        await tx.wait();
        showNotification(`Swapped ${amountIn} ${tokenIn} for ${tokenOut}`, 'success');
    }
}

// Basic notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.innerText = message;
    notification.classList.remove("hidden");
    setTimeout(() => notification.classList.add("hidden"), 3000);
}

// Load token pairs on page load
document.addEventListener("DOMContentLoaded", () => {
    connectWallet().then(loadTokenPairs);
});
