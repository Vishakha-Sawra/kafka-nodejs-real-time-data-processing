const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const app = express();
const port = 8080; 
app.use(cors()); 

// Create MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: '127.0.0.1',
  user: 'root',
  password: 'password',
  database: 'rail_data',
});

app.use(express.json());
app.use(cors()); 

app.get('/api/active-trains', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10; 
    const offset = parseInt(req.query.offset, 10) || 0;
  
    const sql = 'SELECT * FROM active_trains LIMIT ? OFFSET ?';
    pool.query(sql, [limit, offset], (error, results) => {
      if (error) {
        console.error('Error fetching active trains:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(results);
    });
  });
  

app.get('/api/cancelled-trains', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10; 
    const offset = parseInt(req.query.offset, 10) || 0; 
  
    const sql = 'SELECT * FROM cancelled_trains LIMIT ? OFFSET ?';
    pool.query(sql, [limit, offset], (error, results) => {
      if (error) {
        console.error('Error fetching cancelled trains:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json(results); 
    });
  });
  
  
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
