const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  codeforcesHandle: {
    type: String,
    required: [true, 'Please add a Codeforces handle'],
    unique: true,
  },
  currentRating: {
    type: Number,
    default: 0,
  },
  maxRating: {
    type: Number,
    default: 0,
  },
  problemsSolved: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  reminderEmailCount: {
    type: Number,
    default: 0,
  },
  lastSubmissionDate: {
    type: Date,
    default: null,
  },
  contestHistory: [{
    contestId: Number,
    contestName: String,
    rank: Number,
    oldRating: Number,
    newRating: Number,
    unsolvedProblems: [String],
    date: Date,
  }],
  recentSubmissions: [{
    problemId: String,
    problemName: String,
    problemRating: Number,
    verdict: String,
    date: Date,
    problem: {
      contestId: Number,
      index: String,
      name: String,
      rating: Number,
      tags: [String]
    }
  }],
  problemSolvingData: {
    totalSolved: { type: Number, default: 0 },
    problemsByRating: [{
      rating: Number,
      count: Number,
    }],
    tagStats: [{
      tag: String,
      solved: Number,
      attempted: Number,
      successRate: String
    }]
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema); 