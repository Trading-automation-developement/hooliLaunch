import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './mainClientInterface.css';

function ClientInterface() {
  const [connected, setConnected] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  const [newAccountName, setNewAccountName] = useState('');
  const serverIp = "185.241.5.114";

  useEffect(() => {
    const fetchAllowedDestinationsToTracking = async () => {
      try {
        const response = await axios.get(`http://${serverIp}:3003/getDestinationsAllowTracking`);
        const destinationsAllowed = response.data;
        console.log('Fetched data:', destinationsAllowed);
        setTableData(destinationsAllowed.map((destination, index) => ({
          id: index,
          name: destination
        })));
      } catch (error) {
        console.error('Failed to fetch destinations:', error.response ? error.response.data : error.message);
      }
    };

    fetchAllowedDestinationsToTracking();
    fetchClientCount(); // Fetch initial client count on mount
  }, []);

  const fetchClientCount = async () => {
    try {
      const response = await axios.get(`http://${serverIp}:3003/getConnectedClientsInfo`);
      console.log(`${response.data.count}`);
      setClientCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch client count:', error);
    }
  };

  const handleConnect = async () => {
    setConnected(true);
    await fetchClientCount(); // Refresh the client count after connecting
    console.log('Connected to server!');
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

  const handleAddAccount = () => {
    if (newAccountName.trim()) {
      const newAccount = {
        id: tableData.length,
        name: newAccountName.trim()
      };
      setTableData([...tableData, newAccount]);
      setNewAccountName('');
    }
  };

  const handleDeleteAccount = (accountId) => {
    setTableData(tableData.filter(account => account.id !== accountId));
  };

  return (
    <div className="table-container">
      <h1>Client Trade Copier Interface</h1>
      <div className="client-count">Current Connections: {clientCount}</div>
      <table className="table">
        <thead>
          <tr>
            <th>Bag TO Track</th>
            <th>Select</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map(account => (
            <tr key={account.id}>
              <td>{account.name}</td>
              <td>
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account.id)}
                  onChange={() => handleCheckboxChange(account.id)}
                />
              </td>
              <td>
                <button onClick={() => handleDeleteAccount(account.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <input
          type="text"
          value={newAccountName}
          onChange={(e) => setNewAccountName(e.target.value)}
          placeholder="Enter new account name"
        />
        <button onClick={handleAddAccount}>Add Account</button>
      </div>
      <button onClick={handleConnect} disabled={connected} className="button">
        {connected ? 'Connected' : 'Connect to Server'}
      </button>
    </div>
  );
}

export default ClientInterface;