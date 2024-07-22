import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TrainData = () => {
  const [activeTrains, setActiveTrains] = useState([]);
  const [cancelledTrains, setCancelledTrains] = useState([]);

  useEffect(() => {
    const fetchActiveTrains = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/active-trains');
        setActiveTrains(response.data);
      } catch (error) {
        console.error('Error fetching active trains:', error);
      }
    };

    const fetchCancelledTrains = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/cancelled-trains');
        setCancelledTrains(response.data);
      } catch (error) {
        console.error('Error fetching cancelled trains:', error);
      }
    };

    fetchActiveTrains();
    fetchCancelledTrains();
  }, []);

  return (
    <div>
      <h1>Train Data</h1>
      <h2>Active Trains</h2>
      <table>
        <thead>
          <tr>
            <th>Train ID</th>
            <th>Stanox</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {activeTrains.map((train) => (
            <tr key={train.train_id}>
              <td>{train.train_id}</td>
              <td>{train.stanox}</td>
              <td>{new Date(train.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Cancelled Trains</h2>
      <table>
        <thead>
          <tr>
            <th>Train ID</th>
            <th>Stanox</th>
            <th>Reason Code</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {cancelledTrains.map((train) => (
            <tr key={train.train_id}>
              <td>{train.train_id}</td>
              <td>{train.stanox}</td>
              <td>{train.reason_code}</td>
              <td>{new Date(train.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainData;
