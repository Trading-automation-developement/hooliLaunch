import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './permissionGivenSources.css';

const DataTable = () => {
  const [tracking, setTracking] = useState({});
  const [tableData, setTableData] = useState([]);
  const [clientCount, setClientCount] = useState(0);  // State to hold the count of connected clients

  useEffect(() => {
    const storedTrackingData = localStorage.getItem('trackingData');
    if (storedTrackingData) {
      setTracking(JSON.parse(storedTrackingData));
    }
    fetchDestinationsToTracking();
    fetchClientCount(); // Fetch initial client count on mount
  }, []);

  useEffect(() => {
    localStorage.setItem('trackingData', JSON.stringify(tracking));
  }, [tracking]);

  const fetchDestinationsToTracking = async () => {
    try {
      const response = await axios.get('http://localhost:3003/getDestinationsTracking');
      const destinations = response.data;
      console.log(`${destinations}`)
      console.log('In the frontend part:', destinations);
      setTableData(destinations.map((destination, index) => ({
        id: index,
        name: destination  
      })));
      const initialTracking = destinations.reduce((acc, destination, index) => {
        return acc[index] !== undefined ? acc : {...acc, [index]: false};
      }, JSON.parse(localStorage.getItem('trackingData') || '{}'));
      setTracking(initialTracking);
    } catch (error) {
      console.error('Failed to fetch destinations:', error.response ? error.response.data : error.message);
    }
  };

  const fetchClientCount = async () => {
    try {
      const response = await axios.get('http://localhost:3003/countConnectedClients');
      setClientCount(response.data.count); // Assuming the endpoint returns an object with a count property
    } catch (error) {
      console.error('Failed to fetch client count:', error);
    }
  };

  const handleCheckboxChange = (id) => {
    setTracking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    console.log('Permissions given for:', tracking);
    try {
      const response = await axios.post('http://localhost:3003/updatePermissions', tracking);
      console.log('Permissions updated:', response.data);
      alert('Permissions successfully updated.');
      fetchClientCount();  // Refresh the client count after permissions are updated
    } catch (error) {
      console.error('Failed to update permissions:', error.response ? error.response.data : error.message);
      alert('Failed to update permissions.');
    }
  };

  return (
    <div className="table-container">
      <h1>Server Trade Copier Interface</h1>
      <div className="client-count">Current Connections: {clientCount}</div>
      <table className="table">
        <thead>
          <tr>
            <th>Sources</th>
            <th>Allowed Tracking</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((source) => (
            <tr key={source.id}>
              <td>{source.name}</td>
              <td>
                <input
                  type="checkbox"
                  checked={!!tracking[source.id]}
                  onChange={() => handleCheckboxChange(source.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="button" onClick={handleSubmit}>Give Permissions!</button>
    </div>
  );
};

export default DataTable;
