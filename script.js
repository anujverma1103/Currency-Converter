import { currency_list, apiKey } from './currencyCodes.js';

document.addEventListener('DOMContentLoaded', () => {
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const toCurrencySelect = document.getElementById('toCurrency');
    const switchBtn = document.getElementById('switchCurrency');
    const convertBtn = document.getElementById('btn');
    const userValueInput = document.getElementById('userValue');
    const statusEl = document.getElementById('status');
    const resultEl = document.getElementById('result');
    let rateHistoryChart;

    function populateCurrencies() {
        currency_list.forEach(([code, name]) => {
            const optionFrom = new Option(`${code} - ${name}`, code);
            const optionTo = new Option(`${code} - ${name}`, code);
            fromCurrencySelect.add(optionFrom);
            toCurrencySelect.add(optionTo);
        });
        fromCurrencySelect.value = 'USD';
        toCurrencySelect.value = 'INR';
    }

    function swapCurrencies() {
        [fromCurrencySelect.value, toCurrencySelect.value] = [toCurrencySelect.value, fromCurrencySelect.value];
        updateRateHistoryChart();
    }

    async function handleConversion() {
        const amount = parseFloat(userValueInput.value);
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;

        userValueInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        if (isNaN(amount) || amount <= 0) {
            userValueInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            resultEl.textContent = 'Enter a valid amount';
            resultEl.classList.add('text-red-500');
            return;
        }

        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';
        statusEl.textContent = 'Fetching latest rates...';
        resultEl.textContent = '';
        resultEl.classList.remove('text-red-500');

        try {
            const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const data = await response.json();

            if (data.result === 'error') throw new Error(data['error-type']);

            const rate = data.conversion_rates[toCurrency];
            const convertedAmount = (amount * rate).toFixed(2);

            statusEl.textContent = `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
            resultEl.textContent = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;

        } catch (error) {
            statusEl.textContent = 'Error';
            resultEl.textContent = 'Could not fetch rates. Please try again.';
            resultEl.classList.add('text-red-500');
            console.error('Fetch error:', error);
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert';
        }
    }

    function initializeChart() {
        const ctx = document.getElementById('rateHistoryChart').getContext('2d');
        rateHistoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Exchange Rate',
                    data: [],
                    borderColor: 'rgb(20, 184, 166)',
                    backgroundColor: 'rgba(20, 184, 166, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(4);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateRateHistoryChart() {
        const from = fromCurrencySelect.value;
        const to = toCurrencySelect.value;
        rateHistoryChart.data.datasets[0].label = `Rate (${from} to ${to})`;

        const dates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const baseRate = Math.random() * 2 + 0.5;
        const mockRates = Array.from({ length: 7 }, () => baseRate + (Math.random() - 0.5) * (baseRate * 0.1));

        rateHistoryChart.data.labels = dates;
        rateHistoryChart.data.datasets[0].data = mockRates;
        rateHistoryChart.update();
    }

    populateCurrencies();
    initializeChart();
    updateRateHistoryChart();

    switchBtn.addEventListener('click', swapCurrencies);
    convertBtn.addEventListener('click', handleConversion);
    fromCurrencySelect.addEventListener('change', updateRateHistoryChart);
    toCurrencySelect.addEventListener('change', updateRateHistoryChart);
});