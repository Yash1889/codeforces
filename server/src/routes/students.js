const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { fetchCodeforcesData } = require('../services/codeforcesService');
const { sendInactivityEmail } = require('../services/emailService');

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({}, 'name email phoneNumber codeforcesHandle currentRating maxRating lastUpdated');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new student
router.post('/', [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('codeforcesHandle').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const student = new Student(req.body);
    await student.save();
    // Use the same service function as the manual sync endpoint
    await fetchCodeforcesData(student.codeforcesHandle);
    const updatedStudent = await Student.findById(student._id);
    res.status(201).json(updatedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // If Codeforces handle is updated, fetch new data
    if (req.body.codeforcesHandle && req.body.codeforcesHandle !== student.codeforcesHandle) {
      await fetchCodeforcesData(req.body.codeforcesHandle);
    }

    Object.assign(student, req.body);
    await student.save();
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await student.remove();
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get contest history
router.get('/:id/contests', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student.contestHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get problem solving data
router.get('/:id/problems', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student.problemSolvingData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle email notifications
router.patch('/:id/notifications', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    student.emailNotifications.enabled = !student.emailNotifications.enabled;
    await student.save();
    res.json(student.emailNotifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 