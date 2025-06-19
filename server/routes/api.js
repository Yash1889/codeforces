const express = require('express');
const router = express.Router();
const axios = require('axios');
const Student = require('../models/Student');

// ... existing routes ...

// Helper function to validate Codeforces API response
const validateCodeforcesResponse = (response) => {
  if (!response.data) {
    throw new Error('No response from Codeforces API');
  }
  if (response.data.status !== 'OK') {
    throw new Error(response.data.comment || 'Invalid response from Codeforces API');
  }
  if (!response.data.result || (Array.isArray(response.data.result) && response.data.result.length === 0)) {
    throw new Error('No data found for the given handle');
  }
  return response.data;
};

// Proxy routes for Codeforces API
router.get('/codeforces/user/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`, {
      timeout: 10000 // 10 second timeout
    });
    const data = validateCodeforcesResponse(response);
    res.json(data);
  } catch (error) {
    console.error('Error fetching user info:', error.message);
    const errorMessage = error.response?.data?.comment || error.message || 'Failed to fetch user info';
    res.status(error.response?.status || 500).json({ 
      status: 'FAILED',
      comment: errorMessage 
    });
  }
});

router.get('/codeforces/rating/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`, {
      timeout: 10000
    });
    const data = validateCodeforcesResponse(response);
    
    // Even if there's no contest history, return an empty array instead of error
    if (!data.result || data.result.length === 0) {
      return res.json({ 
        status: 'OK',
        result: []
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching rating history:', error.message);
    const errorMessage = error.response?.data?.comment || error.message || 'Failed to fetch rating history';
    res.status(error.response?.status || 500).json({ 
      status: 'FAILED',
      comment: errorMessage 
    });
  }
});

router.get('/codeforces/submissions/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`, {
      timeout: 10000
    });
    const data = validateCodeforcesResponse(response);
    
    // Even if there are no submissions, return an empty array instead of error
    if (!data.result || data.result.length === 0) {
      return res.json({ 
        status: 'OK',
        result: []
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching submissions:', error.message);
    const errorMessage = error.response?.data?.comment || error.message || 'Failed to fetch submissions';
    res.status(error.response?.status || 500).json({ 
      status: 'FAILED',
      comment: errorMessage 
    });
  }
});

module.exports = router; 