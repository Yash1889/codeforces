const express = require('express');
const router = express.Router();
const { fetchCodeforcesData } = require('../services/codeforcesService');
const { updateCronSchedule } = require('../services/cronService');
const Student = require('../models/Student');

// Manually trigger data sync for a student
router.post('/sync/:handle', async (req, res) => {
  try {
    const student = await Student.findOne({ codeforcesHandle: req.params.handle });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await fetchCodeforcesData(student.codeforcesHandle);
    res.json({ message: 'Data sync completed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cron schedule
router.post('/schedule', async (req, res) => {
  try {
    const { schedule } = req.body;
    if (!schedule) {
      return res.status(400).json({ message: 'Schedule is required' });
    }

    updateCronSchedule(schedule);
    res.json({ message: 'Cron schedule updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get student's contest history with filters
router.get('/:handle/contests', async (req, res) => {
  try {
    const student = await Student.findOne({ codeforcesHandle: req.params.handle });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { days } = req.query;
    let filteredContests = student.contestHistory;

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      filteredContests = filteredContests.filter(contest => contest.date >= cutoffDate);
    }

    res.json(filteredContests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's problem solving data with filters
router.get('/:handle/problems', async (req, res) => {
  try {
    const student = await Student.findOne({ codeforcesHandle: req.params.handle });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { days } = req.query;
    let filteredData = { ...student.problemSolvingData };

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      
      // Filter submissions by date
      filteredData.submissions = filteredData.submissions.filter(
        submission => new Date(submission.date) >= cutoffDate
      );

      // Recalculate total solved
      filteredData.totalSolved = filteredData.submissions.reduce(
        (total, submission) => total + submission.count,
        0
      );
    }

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 