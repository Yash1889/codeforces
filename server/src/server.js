const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const codeforcesRoutes = require('./routes/api');
const codeforcesManualRoutes = require('./routes/codeforces');
const { protect, errorHandler } = require('./middleware/authMiddleware');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://codeforces-5.onrender.com', // Add your deployed frontend domain here
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Full URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('=====================');
  next();
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TLE Eliminators API' });
});

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', codeforcesRoutes);
app.use('/api/codeforces', codeforcesManualRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Connect to MongoDB only if not already connected
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Available routes:');
        console.log('- GET /api/students');
        console.log('- GET /api/students/:id');
        console.log('- GET /api/students/:id/recommendations');
      });
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
    });
} else {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- GET /api/students');
    console.log('- GET /api/students/:id');
    console.log('- GET /api/students/:id/recommendations');
  });
}

module.exports = app; 