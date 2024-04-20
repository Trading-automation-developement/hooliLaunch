import React, { useState } from 'react';
import './mainClientInterface.css';

const accountsData = [
  { id: 1, name: 'Account A' },
  { id: 2, name: 'Account B' },
  { id: 3, name: 'Account C' },
];

function ClientInterface() {
  const [connected, setConnected] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [clientCount, setClientCount] = useState(0); // State to track the number of connected clients

  const handleConnect = () => {
    setConnected(true);
    console.log('Connected to server!');
    setClientCount(prevCount => prevCount + 1); // Increment client count upon connection
  };

  const handleCheckboxChange = (accountId) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  return (
    <div className="table-container">
      <h1>Client Trade Copier Interface</h1>
      <div className="client-count">Current Connections: {clientCount}</div> {/* Display the number of connected clients */}
      <table className="table">
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Select</th>
          </tr>
        </thead>
        <tbody>
          {accountsData.map(account => (
            <tr key={account.id}>
              <td>{account.name}</td>
              <td>
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account.id)}
                  onChange={() => handleCheckboxChange(account.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleConnect} disabled={connected} className="button">
        {connected ? 'Connected' : 'Connect to Server'}
      </button>
    </div>
  );
}

export default ClientInterface;
