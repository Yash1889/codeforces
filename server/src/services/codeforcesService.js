const axios = require('axios');
const Student = require('../models/Student');
const { sendInactivityEmail } = require('./emailService');

const CODEFORCES_API_BASE = 'https://codeforces.com/api';

async function fetchCodeforcesData(handle) {
  try {
    // Fetch user info
    const userResponse = await axios.get(`${CODEFORCES_API_BASE}/user.info`, {
      params: { handles: handle }
    });

    const userData = userResponse.data.result[0];
    
    // Fetch user rating history
    const ratingResponse = await axios.get(`${CODEFORCES_API_BASE}/user.rating`, {
      params: { handle }
    });

    // Fetch user submissions
    const submissionsResponse = await axios.get(`${CODEFORCES_API_BASE}/user.status`, {
      params: { handle }
    });

    const student = await Student.findOne({ codeforcesHandle: handle });
    if (!student) {
      throw new Error('Student not found');
    }

    const submissions = submissionsResponse.data.result;
    const solvedProblems = new Set();
    const problemsByRating = new Map();
    const tagStats = new Map();

    submissions.forEach(submission => {
      if (submission.verdict === 'OK') {
        const problem = submission.problem;
        const problemKey = `${problem.contestId}${problem.index}`;
        
        if (!solvedProblems.has(problemKey)) {
          solvedProblems.add(problemKey);
          
          if (problem.rating) {
            const rating = problem.rating;
            problemsByRating.set(rating, (problemsByRating.get(rating) || 0) + 1);
          }

          // Update tag statistics
          if (problem.tags) {
            problem.tags.forEach(tag => {
              if (!tagStats.has(tag)) {
                tagStats.set(tag, { solved: 0, attempted: 0 });
              }
              tagStats.get(tag).solved++;
            });
          }
        }
      }

      // Update tag statistics for all submissions
      if (submission.problem.tags) {
        submission.problem.tags.forEach(tag => {
          if (!tagStats.has(tag)) {
            tagStats.set(tag, { solved: 0, attempted: 0 });
          }
          tagStats.get(tag).attempted++;
        });
      }
    });

    // Update student data
    student.currentRating = userData.rating || 0;
    student.maxRating = userData.maxRating || 0;
    student.problemsSolved = solvedProblems.size;
    student.lastUpdated = new Date();

    // Process contest history
    student.contestHistory = ratingResponse.data.result.map(contest => ({
      contestId: contest.contestId,
      contestName: contest.contestName,
      rank: contest.rank,
      oldRating: contest.oldRating,
      newRating: contest.newRating,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000)
    }));

    // Process recent submissions to match frontend expectation
    student.recentSubmissions = submissions.map(submission => ({
      problemId: `${submission.problem.contestId}-${submission.problem.index}`,
      problemName: submission.problem.name,
      problemRating: submission.problem.rating || null,
      verdict: submission.verdict,
      date: new Date(submission.creationTimeSeconds * 1000),
      problem: {
        ...submission.problem,
        tags: submission.problem.tags || []
      }
    }));

    // Process aggregated problem solving data
    student.problemSolvingData = {
      totalSolved: solvedProblems.size,
      problemsByRating: Array.from(problemsByRating.entries()).map(([rating, count]) => ({
        rating,
        count
      })),
      tagStats: Array.from(tagStats.entries()).map(([tag, stats]) => ({
        tag,
        solved: stats.solved,
        attempted: stats.attempted,
        successRate: (stats.solved / stats.attempted * 100).toFixed(1)
      }))
    };

    await student.save();

    // Check for inactivity
    const lastSubmission = submissions[0];
    if (lastSubmission) {
      const lastSubmissionDate = new Date(lastSubmission.creationTimeSeconds * 1000);
      const daysSinceLastSubmission = (new Date() - lastSubmissionDate) / (1000 * 60 * 60 * 24);

      if (daysSinceLastSubmission >= 7 && student.emailNotifications.enabled) {
        await sendInactivityEmail(student);
        student.emailNotifications.lastSent = new Date();
        student.emailNotifications.sentCount += 1;
        await student.save();
      }
    }

    return student;
  } catch (error) {
    console.error('Error fetching Codeforces data:', error);
    throw error;
  }
}

module.exports = {
  fetchCodeforcesData
}; 