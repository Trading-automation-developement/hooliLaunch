import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

let socket = null;
let socketRemoteServer = null;

const VALID_LICENSES = {
    'XKP7-MNTV-HDLR-9W4E': { expiryDate: '2025-12-31', tier: 'basic' },
    'JR2H-KWVX-9FPB-5MEY': { expiryDate: '2025-12-31', tier: 'basic' },
    'YT6C-NQLZ-8DVA-3UXB': { expiryDate: '2025-12-31', tier: 'basic' },
    'LM4W-PJKH-7RST-2BNX': { expiryDate: '2025-12-31', tier: 'basic' },
    'GF9V-QXCY-5HTU-8AZE': { expiryDate: '2025-12-31', tier: 'basic' },
    'WB3D-RMKP-6NVS-4JGL': { expiryDate: '2025-12-31', tier: 'basic' },
    'KT8H-ZCXY-2WFN-7MVQ': { expiryDate: '2025-12-31', tier: 'basic' },
    'DP5L-BHJA-4RUE-9GST': { expiryDate: '2025-12-31', tier: 'basic' },
    'VN6M-KFWX-3YCP-5ZRD': { expiryDate: '2025-12-31', tier: 'basic' },
    'QA2B-THLG-8EMU-6WYX': { expiryDate: '2025-06-30', tier: 'basic' },
};

function App() {
    const [list, setlist] = useState([["Bar","Sim101"], ["Omer","Sim102"]]);
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
        { value: 'Bar', label: 'Bar' },
        { value: 'Omer', label: 'Omer' },
        { value: 'Edo', label: 'Edo' },
    ];

    const validateLicense = (license) => {
        const licenseDetails = VALID_LICENSES[license];
        if (!licenseDetails) {
            return { isValid: false, message: "Invalid license key" };
        }

        const today = new Date();
        const expiryDate = new Date(licenseDetails.expiryDate);

        if (today > expiryDate) {
            return { isValid: false, message: "License has expired" };
        }

        return {
            isValid: true,
            message: "License valid",
            details: {
                ...licenseDetails,
                remainingDays: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
            }
        };
    };

    const handleLogin = () => {
        const validationResult = validateLicense(licenseNumber);

        if (validationResult.isValid) {
            setIsLoggedIn(true);
            setLicenseInfo(validationResult.details);
            setLoginError("");
        } else {
            setLoginError(validationResult.message);
            setTimeout(() => setLoginError(""), 3000);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            socket = io("http://127.0.0.1:2222", {
                transports: ['polling','websocket'],
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            socketRemoteServer = io('http://83.229.81.169:2666', {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                query: { EIO: "3" }
            });

            // Rest of your socket connection logic remains the same
            socket.on('connect', () => {
                console.log('Local server connected');
                setLocalConnected(true);
                setConnectionStatus('connected');
            });

            // ... (rest of the socket event handlers remain the same)

            return () => {
                if (socket) socket.disconnect();
                if (socketRemoteServer) socketRemoteServer.disconnect();
            };
        }
    }, [isLoggedIn]);

    // Your existing handlers remain the same
    const handleAddAccount = () => {
        if (selectedTrader && destination && socket?.connected) {
            setlist([...list, [selectedTrader, destination]]);
            socket.emit('AddDestination', destination, selectedTrader);
            setDestination("");
            setSelectedTrader("");
        }
    };

    const handleDeleteAccount = (row) => {
        if (socket?.connected) {
            setlist(list.filter(item => !(item[0] === row[0] && item[1] === row[1])));
            socket.emit('DeleteDestination', row);
        }
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

    return (
        <div className="container">
            {!isLoggedIn ? (
                <div style={{ textAlign: 'center' }}>
                    <h1 className="header">Trading Software Login</h1>
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="text"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
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
                    </div>
                </div>
            ) : (
                <>
                    <h1 className="header">Client Interface - Trading Dashboard</h1>

                    <div className="license-info" style={{
                        backgroundColor: '#f5f5f5',
                        padding: '10px',
                        marginBottom: '20px',
                        borderRadius: '4px'
                    }}>
                        <p>License Tier: {licenseInfo.tier.toUpperCase()}</p>
                        <p>Expires in: {licenseInfo.remainingDays} days</p>
                    </div>

                    <div className="status-container">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="status-indicator" style={{ backgroundColor: getStatusColor(connectionStatus) }}></div>
                            <span>Local Server ({connectionStatus})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="status-indicator" style={{ backgroundColor: remoteConnected ? '#4CAF50' : '#f44336' }}></div>
                            <span>Remote Server</span>
                        </div>
                    </div>

                    {/* Rest of your component remains the same */}
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
                                <td>{row.join(" - ")}</td>
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