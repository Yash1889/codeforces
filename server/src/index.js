const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Your API routes here
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/codeforces', require('./routes/codeforces'));
// ... other routes

// Serve static files from React
app.use(express.static(path.join(__dirname, '../../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    const dbName = 'student_progress_db';
    console.log('MONGO_URI:', MONGO_URI);
    await mongoose.connect(MONGO_URI, { dbName });
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

startServer(); 