// backend/index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// GET /api/customers → list all customers
app.get('/api/customers', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = `SELECT * FROM users LIMIT ? OFFSET ?`;
  db.query(query, [limit, offset], (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json({ customers: results, page, limit });
  });
});

// GET /api/customers/:id → specific customer with order count
app.get('/api/customers/:id', (req, res) => {
  const customerId = req.params.id;

  const userQuery = `SELECT * FROM users WHERE id = ?`;
  const orderCountQuery = `SELECT COUNT(*) as order_count FROM orders WHERE user_id = ?`;

  db.query(userQuery, [customerId], (err, users) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (users.length === 0)
      return res.status(404).json({ error: 'Customer not found' });

    const user = users[0];

    db.query(orderCountQuery, [customerId], (err, countResult) => {
      if (err) return res.status(500).json({ error: 'Error counting orders' });

      user.order_count = countResult[0].order_count;
      res.status(200).json(user);
    });
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('🚀 API is running...');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
