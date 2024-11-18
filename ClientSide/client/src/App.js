import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

let socket = null;
let socketRemoteServer = null;

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
        socket = io("http://127.0.0.1:2222", {
            transports: ['polling','websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRemoteServer = io('http://83.229.81.169:2666', {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log('Local server connected');
            setLocalConnected(true);
            setConnectionStatus('connected');
        });

        socket.on('disconnect', () => {
            console.log('Local server disconnected');
            setLocalConnected(false);
            setConnectionStatus('failed');
        });

        socket.on('connect_error', () => {
            console.log('Local server connection error');
            setLocalConnected(false);
            setConnectionStatus('failed');
        });

        socketRemoteServer.on('connect', () => {
            console.log('Remote server connected');
            setRemoteConnected(true);
        });

        socketRemoteServer.on('disconnect', () => {
            console.log('Remote server disconnected');
            setRemoteConnected(false);
        });

        socketRemoteServer.on('TradeNow', (data) => {
            console.log("TradeNow", data);
            if (socket?.connected) {
                socket.emit('TradeNow', data);
            }
        });

        socket.on('SendAllData', (AllData) => {
            console.log('Received data:', AllData);
            if (AllData?.destinations) {
                setlist(AllData.destinations);
            }
        });

        return () => {
            if (socket) socket.disconnect();
            if (socketRemoteServer) socketRemoteServer.disconnect();
        };
    }, []);

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