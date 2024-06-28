import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client'; 

let socket = null;
const DataTable = () => {
  const serverIP = "185.241.5.114";
  const serverPort = 2666;
  const [source, setSource] = useState("Sim101"); 

  // after component mount...
  useEffect(() => {
    // connect to the socket server
    socket = io('ws://127.0.0.1:2666');
  

    socket.on('SendAllData', (AllData) => {
      setSource(AllData.source);

      //console.log("All data ",AllData )
    });
    
  }, []);

  const handleUpdateSource = async (value) => {
    setSource(source);
    socket.emit('UpdateSource', source);
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
