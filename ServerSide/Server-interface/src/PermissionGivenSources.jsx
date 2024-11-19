import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const DataTable = () => {
  const [source, setSource] = useState("Sim101");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("ws://127.0.0.1:2666", {
      transports: ['websocket'],
      reconnection: false
    });

    socketRef.current.on('SendAllData', (AllData) => {
      setSource(AllData.source);
      console.log("SendAllData", AllData);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array

  const handleUpdateSource = () => {
    if (socketRef.current) {
      socketRef.current.emit('UpdateSource', source);
    }
  };

  return (
      <div className="table-container">
        <h1>Server Interface - update only source</h1>
        <div className="source-container">
          <label>Source: </label>
          <input
              type="text"
              placeholder="Edit Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="source-input"
          />
          <button onClick={handleUpdateSource}>Update Source</button>
        </div>
      </div>
  );
};

export default DataTable;