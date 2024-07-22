import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActiveTrainsList = ({ apiUrl, limit }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}?limit=${limit}&offset=${offset}`); 
      console.log('Fetched active trains:', response.data); // Log the fetched data
      if (response.data.length < limit) {
        setHasMore(false);
      }
      setItems(prevItems => [...prevItems, ...response.data]); 
      setOffset(prevOffset => prevOffset + limit); 
    } catch (error) {
      setError('Error fetching data');
      console.error('Error fetching active trains:', error);
    }
    setLoading(false); 
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div>
      {error && <p>{error}</p>}
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              Train ID: {item.train_id}, 
              Stanox: {item.stanox}, 
              Timestamp: {item.timestamp}
            </li>
          ))}
        </ul>
      ) : (
        <p>No data available.</p>
      )}
      {loading && <p>Loading...</p>}
      {hasMore && !loading && (
        <button onClick={fetchItems}>Load More</button>
      )}
    </div>
  );
};

export default ActiveTrainsList;
