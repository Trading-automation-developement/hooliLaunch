import React, { useState, useEffect } from 'react';

function App() {
    const [list, setlist] = useState([["Bar","Sim101"], ["Omer","Sim102"]]);
    const [destination, setDestination] = useState("");
    const [localConnected, setLocalConnected] = useState(false);
    const [remoteConnected, setRemoteConnected] = useState(false);
    const [selectedTrader, setSelectedTrader] = useState("");

    const options = [
        { value: 'Bar', label: 'Bar' },
        { value: 'Omer', label: 'Omer' },
    ];

    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                await fetch('http://127.0.0.1:2222', {
                    method: 'GET',
                    mode: 'no-cors'
                });
                setLocalConnected(true);
            } catch {
                setLocalConnected(false);
            }

            try {
                await fetch('http://83.229.81.169:2666', {
                    method: 'GET',
                    mode: 'no-cors'
                });
                setRemoteConnected(true);
            } catch {
                setRemoteConnected(false);
            }
        };

        checkServerStatus();
        const interval = setInterval(checkServerStatus, 5000);
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

    const containerStyle = {
        padding: '30px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    };

    const headerStyle = {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '30px',
        color: '#333',
        textAlign: 'center',
        width: '100%',
        borderBottom: '2px solid #eee',
        paddingBottom: '15px'
    };

    const statusContainerStyle = {
        display: 'flex',
        gap: '30px',
        marginBottom: '30px',
        padding: '15px',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
        border: '1px solid #eee',
        width: '100%',
        justifyContent: 'center'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden'
    };

    const inputContainerStyle = {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px',
        border: '1px solid #eee',
        width: '100%',
        justifyContent: 'center'
    };

    const inputStyle = {
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '14px',
        width: '200px'
    };

    const buttonStyle = {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s'
    };

    const deleteButtonStyle = {
        padding: '6px 12px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        transition: 'background-color 0.2s'
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
                        backgroundColor: localConnected ? '#4CAF50' : '#f44336',
                        transition: 'background-color 0.3s',
                        boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                    }}></div>
                    <span style={{ fontSize: '14px', color: '#666' }}>Local Server</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: remoteConnected ? '#4CAF50' : '#f44336',
                        transition: 'background-color 0.3s',
                        boxShadow: '0 0 4px rgba(0,0,0,0.2)'
                    }}></div>
                    <span style={{ fontSize: '14px', color: '#666' }}>Remote Server</span>
                </div>
            </div>

            <table style={tableStyle}>
                <thead>
                <tr style={{ backgroundColor: '#f8f8f8' }}>
                    <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '2px solid #eee' }}>Account</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '2px solid #eee' }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {list.map((row, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            {row.join(" - ")}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                            <button
                                onClick={() => handleDeleteAccount(row)}
                                style={deleteButtonStyle}
                                onMouseOver={e => e.target.style.backgroundColor = '#c82333'}
                                onMouseOut={e => e.target.style.backgroundColor = '#dc3545'}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div style={inputContainerStyle}>
                <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination name"
                    style={inputStyle}
                />

                <select
                    value={selectedTrader}
                    onChange={(e) => setSelectedTrader(e.target.value)}
                    style={inputStyle}
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
                    style={{
                        ...buttonStyle,
                        opacity: (!localConnected || !remoteConnected) ? '0.6' : '1',
                        cursor: (!localConnected || !remoteConnected) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={!localConnected || !remoteConnected}
                    onMouseOver={e => {
                        if (localConnected && remoteConnected) {
                            e.target.style.backgroundColor = '#0056b3';
                        }
                    }}
                    onMouseOut={e => e.target.style.backgroundColor = '#007bff'}
                >
                    Add Account
                </button>
            </div>
        </div>
    );
}

export default App;