import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './mainClientInterface.css';

function ClientInterface() {
  const [connected, setConnected] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAllowedDestinationsToTracking();
    fetchClientCount(); // Fetch initial client count on mount
  }, []);

  const fetchAllowedDestinationsToTracking = async () => {
    try {
      const response = await axios.get('http://localhost:3003/getDestinationsAllowTracking');
      setTableData(response.data.map((destination, index) => ({
        id: index,
        name: destination
      })));
    } catch (error) {
      console.error('Failed to fetch destinations:', error.response ? error.response.data : error.message);
    }
  };

  const fetchClientCount = async () => {
    try {
      const response = await axios.get('http://localhost:3003/countConnectedClients');
      setClientCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch client count:', error);
    }
  };

  const handleConnect = async () => {
    if (username.trim() === '') {
      alert('Please enter a username before connecting.');
      return;
    }
    setConnected(true);
    await fetchClientCount(); // Refresh the client count after connecting
    console.log('Connected to server!');
  };

  const handleCheckboxChange = (accountId) => {
    setSelectedAccounts(prev => prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]);
  };

  const handleSubmitUsername = async () => {
    if (!username.trim()) {
      alert('Please enter a username.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('http://localhost:3003/submitUsername', { username });
      alert('Username submitted successfully!');
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting username:', error);
      alert('Failed to submit username.');
      setSubmitting(false);
    }
  };

  return (
    <div className="table-container">
      <h1>Client Trade Copier Interface</h1>
      <div className="client-count">Current Connections: {clientCount}</div>
      <input
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="username-input"
      />
      <button onClick={handleSubmitUsername} disabled={submitting} className="button">
        {submitting ? 'Submitting...' : 'Submit Username'}
      </button>
      <table className="table">
        <thead>
          <tr>
            <th>Bag To Track</th>
            <th>Select</th>
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
