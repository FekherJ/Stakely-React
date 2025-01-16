import React, { useEffect, useState } from 'react';
import { useWallet } from '../components/WalletProvider';
import useStaking from '../hooks/useStaking';

const TransactionHistory = () => {
  const { stakingContract } = useWallet();
  const { fetchTransactionHistory } = useStaking();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!stakingContract) {
        console.warn('Staking contract is not initialized.');
        return;
      }
      try {
        const history = await fetchTransactionHistory();
        setTransactions(history);
      } catch (error) {
        console.error('Failed to fetch transaction history:', error.message);
        alert('Error loading transaction history.');
      }
    };
    loadHistory();
  }, [stakingContract]);

  return (
    <div className="transaction-history glass p-6 rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-4">📜 Transaction History</h2>
      <table className="transaction-table w-full">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((tx, idx) => (
              <tr key={idx}>
                <td>{tx.type}</td>
                <td>{tx.amount}</td>
                <td>{tx.timestamp}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No transactions found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
