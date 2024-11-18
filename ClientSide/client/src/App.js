import React, { useState, useEffect } from 'react';

function App() {
    const [list, setlist] = useState([["Bar","Sim101"], ["Omer","Sim102"]]);
    const [destination, setDestination] = useState("");
    const [localConnected, setLocalConnected] = useState(false);
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [selectedTrader, setSelectedTrader] = useState("");
    const [connectionStatus, setConnectionStatus] = useState('pending');

    const options = [
        { value: 'Bar', label: 'Bar' },
        { value: 'Omer', label: 'Omer' },
    ];

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 5;
        const retryInterval = 2000; // 2 seconds

        const checkConnection = async () => {
            try {
                const response = await fetch('http://127.0.0.1:2222', {
                    method: 'GET',
                    mode: 'no-cors'
                });
                setLocalConnected(true);
                setConnectionStatus('connected');
                retryCount = 0; // Reset retry count on successful connection
            } catch (error) {
                console.log('Connection attempt failed:', error);
                retryCount++;

                if (retryCount < maxRetries) {
                    setConnectionStatus(`retrying (${retryCount}/${maxRetries})`);
                    setTimeout(checkConnection, retryInterval);
                } else {
                    setConnectionStatus('failed');
                    setLocalConnected(false);
                }
            }

            try {
                const remoteResponse = await fetch('http://83.229.81.169:2666', {
                    method: 'GET',
                    mode: 'no-cors'
                });
                setRemoteConnected(true);
            } catch {
                setRemoteConnected(false);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddAccount = () => {
        if (selectedTrader && destination) {
            setlist([...list, [selectedTrader, destination]]);
            setDestination("");
            setSelectedTrader("");
        }
    };

    const handleDeleteAccount = (row) => {
        setlist(list.filter(item => !(item[0] === row[0] && item[1] === row[1])));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected':
                return '#4CAF50';
            case 'pending':
                return '#FFA500';
            case 'failed':
                return '#f44336';
            default:
                return '#FFA500';
        }
    };

    const containerStyle = {
        padding: '30px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
    };

    const headerStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '30px',
        textAlign: 'center'
    };

    const statusContainerStyle = {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
    };

    return (
        <div style={containerStyle}>
            <h1 style={headerStyle}>Client Interface - put our destinations</h1>

            <div style={statusContainerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(connectionStatus),
                        transition: 'background-color 0.3s'
                    }}></div>
                    <span>Local Server ({connectionStatus})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: remoteConnected ? '#4CAF50' : '#f44336',
                        transition: 'background-color 0.3s'
                    }}></div>
                    <span>Remote Server</span>
                </div>
            </div>

            {/* Rest of your component */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Account</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {list.map((row, index) => (
                    <tr key={index}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{row.join(" - ")}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                            <button
                                onClick={() => handleDeleteAccount(row)}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination name"
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                />

                <select
                    value={selectedTrader}
                    onChange={(e) => setSelectedTrader(e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="">Select trader...</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleAddAccount}
                    disabled={!localConnected || !remoteConnected}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: (!localConnected || !remoteConnected) ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (!localConnected || !remoteConnected) ? 'not-allowed' : 'pointer'
                    }}
                >
                    Add Account
                </button>
            </div>
        </div>
    );
}

export default App;