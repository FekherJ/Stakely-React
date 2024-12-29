document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amountInput');
    const durationInput = document.getElementById('durationInput');
    const apyInput = document.getElementById('apyInput');
    const calculateButton = document.getElementById('calculateButton');
    const resultSection = document.getElementById('resultSection');

    // Function to calculate rewards
    function calculateRewards(amount, duration, apy) {
        const daysInYear = 365;
        const rate = apy / 100;
        const durationFactor = duration / daysInYear;

        // Compound interest formula for rewards estimation
        const futureValue = amount * Math.pow(1 + rate, durationFactor);
        const rewards = futureValue - amount;

        return rewards;
    }

    // Event Listener for Calculation
    calculateButton.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
        const duration = parseInt(durationInput.value, 10);
        const apy = parseFloat(apyInput.value);

        if (isNaN(amount) || amount <= 0) {
            alert('Enter a valid staking amount!');
            return;
        }

        if (isNaN(duration) || duration <= 0) {
            alert('Enter a valid staking duration!');
            return;
        }

        if (isNaN(apy) || apy <= 0) {
            alert('Enter a valid APY percentage!');
            return;
        }

        // Calculate rewards
        const rewards = calculateRewards(amount, duration, apy);

        // Display the result
        resultSection.innerText = `Estimated Rewards: ${rewards.toFixed(4)} RWD`;
    });
});
