import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

let socket = null;
let socketRemoteServer = null;

function App() {
    const [list, setlist] = useState([]);
    const [destination, setDestination] = useState("");
    const [localConnected, setLocalConnected] = useState(false);
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [selectedTrader, setSelectedTrader] = useState("");
    const [connectionStatus, setConnectionStatus] = useState('pending');
    const [licenseNumber, setLicenseNumber] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [licenseInfo, setLicenseInfo] = useState(null);
    const [loginError, setLoginError] = useState("");

    const options = [
        { value: 'Edo', label: 'Edo' },
    ];

    const initializeRemoteSocket = () => {
        console.log('Initializing remote socket...');

        if (socketRemoteServer) {
            socketRemoteServer.disconnect();
        }

        socketRemoteServer = io('http://127.0.0.1:2666', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });

        socketRemoteServer.on('connect', () => {
            console.log('Connected to remote server');
            setRemoteConnected(true);
            setConnectionStatus('pending');

            // Send authentication request immediately after connection
            socketRemoteServer.emit('authenticate', {
                licenseKey: licenseNumber,
                clientInfo: {
                    ip: window.location.hostname,
                    userAgent: navigator.userAgent
                }
            });
        });

        socketRemoteServer.on('authenticated', (response) => {
            console.log('Authentication response:', response);
            if (response.status === 'success' && response.valid) {
                setIsLoggedIn(true);
                setLicenseInfo(response);
                setLoginError("");
                setConnectionStatus('connected');
                socketRemoteServer.emit('requestInitialData');
            } else {
                setLoginError(response.message || 'Invalid license key');
                setConnectionStatus('failed');
                setIsLoggedIn(false);
                socketRemoteServer.disconnect();
            }
        });

        socketRemoteServer.on('disconnect', () => {
            console.log('Disconnected from remote server');
            setRemoteConnected(false);
            setConnectionStatus('failed');
            setIsLoggedIn(false);
        });

        socketRemoteServer.on('connect_error', (error) => {
            console.error('Connection error:', error);
            setLoginError('Connection failed');
            setConnectionStatus('failed');
        });

        socketRemoteServer.on('error', (error) => {
            console.error('Socket error:', error);
            setLoginError('Connection error occurred');
        });

        socketRemoteServer.on('SendAllData', (data) => {
            console.log('Received all data:', data);
            if (data?.destinations) {
                const formattedList = Array.isArray(data.destinations)
                    ? data.destinations.map(dest => [data.trader1, dest])
                    : [];
                console.log('Formatted list:', formattedList);
                setlist(formattedList);
            }
        });

        socketRemoteServer.on('NewTrade', (data) => {
            console.log("TradeNow", data);
            if (socket?.connected) {
                socket.emit('TradeNow', data);
            }
        });
    };

    const initializeLocalSocket = () => {
        if (socket) {
            socket.disconnect();
        }

        socket = io("http://127.0.0.1:2222", {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('Local server connected');
            setLocalConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Local server disconnected');
            setLocalConnected(false);
        });
    };

    useEffect(() => {
        initializeLocalSocket();
        return () => {
            if (socket) socket.disconnect();
            if (socketRemoteServer) socketRemoteServer.disconnect();
        };
    }, []);

    const handleLogin = () => {
        if (!licenseNumber.trim()) {
            setLoginError("Please enter a license key");
            return;
        }
        setLoginError("");
        initializeRemoteSocket();
    };

    const handleAddAccount = () => {
        if (selectedTrader && destination && socketRemoteServer?.connected) {
            const newEntry = [selectedTrader, destination];

            socketRemoteServer.emit('AddDestination', {
                destination,
                trader: selectedTrader
            });

            setlist(prevList => [...prevList, newEntry]);
            setDestination("");
            setSelectedTrader("");
        }
    };


    const handleDeleteAccount = (row) => {
        if (socketRemoteServer?.connected) {
            socketRemoteServer.emit('DeleteDestination', {
                trader: row[0],
                destination: row[1]
            });
            setlist(prevList =>
                prevList.filter(item =>
                    !(item[0] === row[0] && item[1] === row[1])
                )
            );
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'connected': return '#4CAF50';
            case 'pending': return '#FFA500';
            case 'failed': return '#f44336';
            default: return '#FFA500';
        }
    };

    return (
        <div className="container">
            {!isLoggedIn ? (
                <div style={{ textAlign: 'center' }}>
                    <h1 className="header">Trading Software Login</h1>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                            placeholder="Enter license key"
                            className="input"
                        />
                        <button
                            onClick={handleLogin}
                            className="add-button"
                        >
                            Login
                        </button>
                        {loginError && (
                            <div style={{ color: '#f44336', marginTop: '10px' }}>
                                {loginError}
                            </div>
                        )}
                        {licenseInfo && (
                            <div style={{ color: '#4CAF50', marginTop: '10px' }}>
                                Tier: {licenseInfo.tier} | Features: {licenseInfo.features.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="header">Client Interface - Trading Dashboard</h1>

                    <div className="status-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="status-indicator" style={{ backgroundColor: getStatusColor(connectionStatus) }}></div>
                            <span>Local Server ({connectionStatus})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="status-indicator" style={{ backgroundColor: remoteConnected ? '#4CAF50' : '#f44336' }}></div>
                            <span>Remote Server</span>
                        </div>
                        {licenseInfo && (
                            <div style={{ marginLeft: 'auto' }}>
                                <span>Tier: {licenseInfo.tier}</span>
                            </div>
                        )}
                    </div>

                    <table className="table">
                        <thead>
                        <tr>
                            <th>Account</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {list.map((row, index) => (
                            <tr key={index}>
                                <td>{`${row[0]} - ${row[1]}`}</td>
                                <td>
                                    <button
                                        onClick={() => handleDeleteAccount(row)}
                                        className="button"
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
                            className="input"
                        />

                        <select
                            value={selectedTrader}
                            onChange={(e) => setSelectedTrader(e.target.value)}
                            className="select"
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
                            className={`add-button ${(!localConnected || !remoteConnected) ? 'disabled' : ''}`}
                        >
                            Add Account
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default App;