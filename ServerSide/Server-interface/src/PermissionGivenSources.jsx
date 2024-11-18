import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client'; 

var socket = null;
const DataTable = () => {
  const serverIP = "83.229.81.169";
  const serverPort = 2666;
  const [source, setSource] = useState("Sim101"); 
  socket = io("ws://127.0.0.1:2666");



  // useEffect(() => {
    
  //   socket.on('SendAllData', (AllData) => {
  //     setSource(AllData.source);

  //     console.log("SendAllData",AllData )
  //   });
  //   return () => socket.off('disconnect', () => {})
  // }, []);

  // after component mount...
  useEffect(() => {
    console.log("use effect" )
    
    // socket.on('SendAllData', (AllData) => {
    //   setSource(AllData.source);
    //   console.log("SendAllData" )
    // });
    
  }, [source]);

  const handleUpdateSource = async (value) => {
    console.log("handleUpdateSource" , source)
    setSource(source);
    //socket.emit('UpdateSource', source);
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
