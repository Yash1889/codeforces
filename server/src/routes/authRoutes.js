const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Basic auth routes
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint' });
});

module.exports = router; 