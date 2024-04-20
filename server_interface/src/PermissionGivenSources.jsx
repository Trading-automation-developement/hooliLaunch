import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './permissionGivenSources.css';

const DataTable = () => {
  const [tracking, setTracking] = useState({});
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const storedTrackingData = localStorage.getItem('trackingData');
    if (storedTrackingData) {
      setTracking(JSON.parse(storedTrackingData));
    }
    fetchDestinationsToTracking();
  }, []);

  useEffect(() => {
    localStorage.setItem('trackingData', JSON.stringify(tracking));
  }, [tracking]);

  const fetchDestinationsToTracking = async () => {
    try {
      const response = await axios.get('http://localhost:3001/getDestinationsTracking');
      const destinations = response.data;
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

  const handleCheckboxChange = (id) => {
    setTracking(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    console.log('Permissions given for:', tracking);
    try {
      const response = await axios.post('http://localhost:3001/updatePermissions', tracking);
      console.log('Permissions updated:', response.data);
      alert('Permissions successfully updated.');
    } catch (error) {
      console.error('Failed to update permissions:', error.response ? error.response.data : error.message);
      alert('Failed to update permissions.');
    }
  };

  return (
    <div className="table-container">
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
