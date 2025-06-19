// Simple middleware to protect routes
// In a real application, this would verify JWT tokens
exports.protect = (req, res, next) => {
  // For now, just pass through
  // TODO: Implement proper authentication
  next();
};

// Error handling middleware
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}; 