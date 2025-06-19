const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Student = require('../models/Student');
const axios = require('axios');

// Cache for Codeforces problems
let problemsCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to get difficulty color
const getDifficultyColor = (rating) => {
  if (rating < 1200) return '#808080'; // Gray
  if (rating < 1400) return '#008000'; // Green
  if (rating < 1600) return '#03A89E'; // Cyan
  if (rating < 1900) return '#0000FF'; // Blue
  if (rating < 2200) return '#AA00AA'; // Purple
  if (rating < 2400) return '#FF8C00'; // Orange
  return '#FF0000'; // Red
};

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('=====================');
  next();
});

// Base routes
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('Creating student with body:', req.body);
    const student = await Student.create(req.body);
    let codeforcesError = null;
    try {
      await syncCodeforcesData(student);
    } catch (cfErr) {
      codeforcesError = cfErr.message || 'Failed to fetch Codeforces data';
      console.error('Codeforces fetch error:', codeforcesError);
    }
    const updatedStudent = await Student.findById(student._id);
    if (codeforcesError) {
      return res.status(201).json({ student: updatedStudent, warning: codeforcesError });
    }
    res.status(201).json(updatedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Student-specific routes with proper error handling
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch and update Codeforces data before returning
    let cfData = null;
    let submissions = [];
    let contestHistory = [];
    let problemSolvingData = {
      totalSolved: 0,
      problemsByRating: [],
      tagStats: [],
      averagePerDay: 0.0
    };
    try {
      // 1. Fetch user.info
      const cfInfoRes = await axios.get(`https://codeforces.com/api/user.info?handles=${student.codeforcesHandle}`);
      if (cfInfoRes.data.status === 'OK' && cfInfoRes.data.result && cfInfoRes.data.result.length > 0) {
        cfData = cfInfoRes.data.result[0];
        student.currentRating = cfData.rating || 0;
        student.maxRating = cfData.maxRating || 0;
        student.rank = cfData.rank || '';
      }
      // 2. Fetch user.status (submissions)
      const cfStatusRes = await axios.get(`https://codeforces.com/api/user.status?handle=${student.codeforcesHandle}&from=1&count=1000`);
      if (cfStatusRes.data.status === 'OK' && Array.isArray(cfStatusRes.data.result)) {
        submissions = cfStatusRes.data.result;
        // Calculate problems solved
        const solvedSet = new Set();
        const tagMap = {};
        const ratingMap = {};
        const recentSubmissions = [];
        let earliestSubmission = null;
        let latestSubmission = null;
        submissions.forEach((sub, idx) => {
          if (sub.verdict === 'OK' && sub.problem) {
            const pid = `${sub.problem.contestId}-${sub.problem.index}`;
            solvedSet.add(pid);
            // Tag stats
            if (Array.isArray(sub.problem.tags)) {
              sub.problem.tags.forEach(tag => {
                if (!tagMap[tag]) tagMap[tag] = { solved: 0, attempted: 0 };
                tagMap[tag].solved = (tagMap[tag].solved || 0) + 1;
              });
            }
            // Problems by rating
            if (sub.problem.rating) {
              if (!ratingMap[sub.problem.rating]) ratingMap[sub.problem.rating] = 0;
              ratingMap[sub.problem.rating] += 1;
            }
          }
          // Tag stats for attempted
          if (sub.problem && Array.isArray(sub.problem.tags)) {
            sub.problem.tags.forEach(tag => {
              if (!tagMap[tag]) tagMap[tag] = { solved: 0, attempted: 0 };
              tagMap[tag].attempted = (tagMap[tag].attempted || 0) + 1;
            });
          }
          // Collect recent submissions (last 10)
          if (idx < 10 && sub.problem) {
            recentSubmissions.push({
              problemId: `${sub.problem.contestId}-${sub.problem.index}`,
              problemName: sub.problem.name,
              problemRating: sub.problem.rating || null,
              verdict: sub.verdict,
              date: new Date(sub.creationTimeSeconds * 1000),
              problem: {
                contestId: sub.problem.contestId,
                index: sub.problem.index,
                name: sub.problem.name,
                rating: sub.problem.rating,
                tags: sub.problem.tags
              }
            });
          }
          // Track earliest and latest submission dates
          if (sub.creationTimeSeconds) {
            const subDate = new Date(sub.creationTimeSeconds * 1000);
            if (!earliestSubmission || subDate < earliestSubmission) earliestSubmission = subDate;
            if (!latestSubmission || subDate > latestSubmission) latestSubmission = subDate;
          }
        });
        problemSolvingData.totalSolved = solvedSet.size;
        problemSolvingData.problemsByRating = Object.entries(ratingMap).map(([rating, count]) => ({ rating: Number(rating), count }));
        problemSolvingData.tagStats = Object.entries(tagMap).map(([tag, stats]) => {
          const attempted = typeof stats.attempted === 'number' ? stats.attempted : 0;
          const solved = typeof stats.solved === 'number' ? stats.solved : 0;
          return {
            tag,
            solved,
            attempted,
            successRate: attempted > 0 ? ((solved / attempted) * 100).toFixed(1) + '%' : '0.0%'
          };
        });
        // Calculate average problems per day
        let avgPerDay = 0.0;
        if (earliestSubmission && latestSubmission && solvedSet.size > 0) {
          const days = Math.max(1, Math.ceil((latestSubmission - earliestSubmission) / (1000 * 60 * 60 * 24)));
          avgPerDay = (solvedSet.size / days).toFixed(2);
        }
        problemSolvingData.averagePerDay = avgPerDay;
        student.problemsSolved = solvedSet.size;
        student.problemSolvingData = problemSolvingData;
        student.recentSubmissions = recentSubmissions;
      }
      // 3. Fetch user.rating (contest history)
      const cfRatingRes = await axios.get(`https://codeforces.com/api/user.rating?handle=${student.codeforcesHandle}`);
      if (cfRatingRes.data.status === 'OK' && Array.isArray(cfRatingRes.data.result)) {
        contestHistory = cfRatingRes.data.result.map(contest => ({
          contestId: contest.contestId,
          contestName: contest.contestName,
          rank: contest.rank,
          oldRating: contest.oldRating,
          newRating: contest.newRating,
          date: new Date(contest.ratingUpdateTimeSeconds * 1000)
        }));
        student.contestHistory = contestHistory;
      }
      await student.save();
    } catch (cfErr) {
      console.error('Error updating Codeforces data on profile view:', cfErr.message);
    }

    // Refetch the updated student to ensure latest data is sent
    const updatedStudent = await Student.findById(student._id);
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});

// Recommendations route - must come before :id route
router.get('/:id/recommendations', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's solved problems
    const solvedProblems = new Set(
      student.recentSubmissions
        .filter(sub => sub.verdict === 'OK')
        .map(sub => `${sub.problem.contestId}${sub.problem.index}`)
    );

    // Get student's attempted problems
    const attemptedProblems = new Set(
      student.recentSubmissions
        .map(sub => `${sub.problem.contestId}${sub.problem.index}`)
    );

    // Get student's tag statistics
    const tagStats = student.problemSolvingData?.tagStats || [];
    const weakTags = tagStats
      .filter(tag => tag.successRate < 50)
      .map(tag => tag.tag);

    // Calculate target rating range
    const currentRating = student.currentRating;
    const targetRating = Math.min(currentRating + 200, 2000);
    const minRating = Math.max(currentRating - 100, 800);

    // Use cached problems or fetch new ones
    let problems = problemsCache;
    if (!problemsCache || !lastCacheUpdate || (Date.now() - lastCacheUpdate > CACHE_DURATION)) {
      try {
        console.log('Fetching problems from Codeforces API');
        const response = await axios.get('https://codeforces.com/api/problemset.problems');
        if (response.data.status === 'OK') {
          problems = response.data.result.problems.map(problem => {
            // Generate realistic placeholder statistics based on rating
            let solvedCount, attempted, successRate;
            
            if (problem.rating) {
              // Higher rating problems typically have fewer solvers but higher success rates
              if (problem.rating < 1200) {
                solvedCount = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 solvers
                attempted = Math.floor(solvedCount * (1.2 + Math.random() * 0.8)); // 20-100% more attempts
              } else if (problem.rating < 1600) {
                solvedCount = Math.floor(Math.random() * 3000) + 500; // 500-3500 solvers
                attempted = Math.floor(solvedCount * (1.3 + Math.random() * 0.7)); // 30-100% more attempts
              } else if (problem.rating < 2000) {
                solvedCount = Math.floor(Math.random() * 1500) + 200; // 200-1700 solvers
                attempted = Math.floor(solvedCount * (1.4 + Math.random() * 0.6)); // 40-100% more attempts
              } else if (problem.rating < 2400) {
                solvedCount = Math.floor(Math.random() * 800) + 100; // 100-900 solvers
                attempted = Math.floor(solvedCount * (1.5 + Math.random() * 0.5)); // 50-100% more attempts
              } else {
                solvedCount = Math.floor(Math.random() * 400) + 50; // 50-450 solvers
                attempted = Math.floor(solvedCount * (1.6 + Math.random() * 0.4)); // 60-100% more attempts
              }
              
              // Calculate success rate (higher for higher rated problems)
              const baseSuccessRate = Math.max(20, 80 - (problem.rating - 800) / 20); // Decreases with rating
              successRate = Math.min(95, Math.max(5, baseSuccessRate + (Math.random() - 0.5) * 20));
            } else {
              // For unrated problems, use moderate values
              solvedCount = Math.floor(Math.random() * 2000) + 500;
              attempted = Math.floor(solvedCount * (1.2 + Math.random() * 0.8));
              successRate = 30 + Math.random() * 40; // 30-70%
            }

            return {
              ...problem,
              statistics: {
                successRate: parseFloat(successRate.toFixed(1)),
                solvedCount: solvedCount,
                attempted: attempted
              }
            };
          });
          problemsCache = problems;
          lastCacheUpdate = Date.now();
          console.log('Cached problems count:', problems.length);
        } else {
          throw new Error('Codeforces API returned error status');
        }
      } catch (error) {
        console.error('Error fetching problems from Codeforces:', error);
        if (problemsCache) {
          problems = problemsCache;
          console.log('Using cached problems:', problems.length);
        } else {
          return res.status(500).json({ 
            message: 'Error fetching problems from Codeforces',
            error: error.message 
          });
        }
      }
    }

    // Filter and categorize problems
    const recommendations = [
      {
        title: 'Rating Progression',
        description: 'Problems to help you progress to the next rating level',
        problems: problems
          .filter(p => 
            p.rating >= minRating && 
            p.rating <= targetRating &&
            !solvedProblems.has(`${p.contestId}${p.index}`) &&
            !attemptedProblems.has(`${p.contestId}${p.index}`)
          )
          .sort((a, b) => a.rating - b.rating)
          .slice(0, 5)
          .map(p => ({
            ...p,
            difficultyColor: getDifficultyColor(p.rating),
            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            contestUrl: `https://codeforces.com/contest/${p.contestId}`,
            tags: p.tags.sort()
          }))
      },
      {
        title: 'Weak Areas',
        description: 'Problems to improve your weaker topics',
        problems: problems
          .filter(p => 
            p.rating >= minRating && 
            p.rating <= currentRating + 100 &&
            p.tags.some(tag => weakTags.includes(tag)) &&
            !solvedProblems.has(`${p.contestId}${p.index}`) &&
            !attemptedProblems.has(`${p.contestId}${p.index}`)
          )
          .sort((a, b) => a.rating - b.rating)
          .slice(0, 5)
          .map(p => ({
            ...p,
            difficultyColor: getDifficultyColor(p.rating),
            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            contestUrl: `https://codeforces.com/contest/${p.contestId}`,
            tags: p.tags.sort()
          }))
      },
      {
        title: 'Practice Problems',
        description: 'Problems at your current level to maintain consistency',
        problems: problems
          .filter(p => 
            p.rating >= currentRating - 100 && 
            p.rating <= currentRating + 100 &&
            !solvedProblems.has(`${p.contestId}${p.index}`) &&
            !attemptedProblems.has(`${p.contestId}${p.index}`)
          )
          .sort((a, b) => a.rating - b.rating)
          .slice(0, 5)
          .map(p => ({
            ...p,
            difficultyColor: getDifficultyColor(p.rating),
            url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
            contestUrl: `https://codeforces.com/contest/${p.contestId}`,
            tags: p.tags.sort()
          }))
      }
    ];

    console.log('Generated recommendations:', recommendations.map(r => ({
      title: r.title,
      problemCount: r.problems.length,
      sampleProblem: r.problems[0] ? {
        name: r.problems[0].name,
        rating: r.problems[0].rating,
        statistics: r.problems[0].statistics
      } : null
    })));

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations', error: error.message });
  }
});

// Sync by MongoDB ID
router.post('/:id/sync', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await syncCodeforcesData(student);
    const updatedStudent = await Student.findById(student._id);
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error syncing student', error: error.message });
  }
});

// Sync by Codeforces handle
router.post('/sync/handle/:handle', async (req, res) => {
  try {
    const student = await Student.findOne({ codeforcesHandle: req.params.handle });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    await syncCodeforcesData(student);
    const updatedStudent = await Student.findById(student._id);
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: 'Error syncing student by handle', error: error.message });
  }
});

// Sync all students
router.post('/syncAll', async (req, res) => {
  try {
    const students = await Student.find({});
    const updated = [];
    for (const student of students) {
      try {
        await syncCodeforcesData(student);
        updated.push({ id: student._id, handle: student.codeforcesHandle, name: student.name });
      } catch (err) {
        updated.push({ id: student._id, handle: student.codeforcesHandle, name: student.name, error: err.message });
      }
    }
    res.status(200).json({ updated });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing all students', error: error.message });
  }
});

// --- SYNC LOGIC ---
async function syncCodeforcesData(student) {
  let cfData = null;
  let submissions = [];
  let contestHistory = [];
  let problemSolvingData = {
    totalSolved: 0,
    problemsByRating: [],
    tagStats: [],
    averagePerDay: 0.0
  };
  // 1. Fetch user.info
  const cfInfoRes = await axios.get(`https://codeforces.com/api/user.info?handles=${student.codeforcesHandle}`);
  if (cfInfoRes.data.status !== 'OK' || !cfInfoRes.data.result || cfInfoRes.data.result.length === 0) {
    throw new Error('Invalid Codeforces handle');
  }
  cfData = cfInfoRes.data.result[0];
  student.currentRating = cfData.rating || 0;
  student.maxRating = cfData.maxRating || 0;
  student.rank = cfData.rank || '';
  // 2. Fetch user.status (submissions)
  const cfStatusRes = await axios.get(`https://codeforces.com/api/user.status?handle=${student.codeforcesHandle}&from=1&count=1000`);
  if (cfStatusRes.data.status === 'OK' && Array.isArray(cfStatusRes.data.result)) {
    submissions = cfStatusRes.data.result;
    const solvedSet = new Set();
    const tagMap = {};
    const ratingMap = {};
    const recentSubmissions = [];
    let earliestSubmission = null;
    let latestSubmission = null;
    submissions.forEach((sub, idx) => {
      if (sub.verdict === 'OK' && sub.problem) {
        const pid = `${sub.problem.contestId}-${sub.problem.index}`;
        solvedSet.add(pid);
        if (Array.isArray(sub.problem.tags)) {
          sub.problem.tags.forEach(tag => {
            if (!tagMap[tag]) tagMap[tag] = { solved: 0, attempted: 0 };
            tagMap[tag].solved = Number(tagMap[tag].solved || 0) + 1;
          });
        }
        if (sub.problem.rating) {
          if (!ratingMap[sub.problem.rating]) ratingMap[sub.problem.rating] = 0;
          ratingMap[sub.problem.rating] += 1;
        }
      }
      if (sub.problem && Array.isArray(sub.problem.tags)) {
        sub.problem.tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = { solved: 0, attempted: 0 };
          tagMap[tag].attempted = Number(tagMap[tag].attempted || 0) + 1;
        });
      }
      // Always collect last 10 submissions, regardless of verdict
      if (idx < 10 && sub.problem) {
        recentSubmissions.push({
          problemId: `${sub.problem.contestId}-${sub.problem.index}`,
          problemName: sub.problem.name,
          problemRating: sub.problem.rating || null,
          verdict: sub.verdict,
          date: new Date(sub.creationTimeSeconds * 1000),
          problem: {
            contestId: sub.problem.contestId,
            index: sub.problem.index,
            name: sub.problem.name,
            rating: sub.problem.rating,
            tags: sub.problem.tags
          }
        });
      }
      if (sub.creationTimeSeconds) {
        const subDate = new Date(sub.creationTimeSeconds * 1000);
        if (!earliestSubmission || subDate < earliestSubmission) earliestSubmission = subDate;
        if (!latestSubmission || subDate > latestSubmission) latestSubmission = subDate;
      }
    });
    problemSolvingData.totalSolved = solvedSet.size;
    problemSolvingData.problemsByRating = Object.entries(ratingMap).map(([rating, count]) => ({ rating: Number(rating), count }));
    problemSolvingData.tagStats = Object.entries(tagMap).map(([tag, stats]) => {
      const attempted = Number(stats.attempted || 0);
      const solved = Number(stats.solved || 0);
      return {
        tag,
        solved,
        attempted,
        successRate: attempted > 0 ? ((solved / attempted) * 100).toFixed(1) + '%' : '0.0%'
      };
    });
    let avgPerDay = 0.0;
    if (earliestSubmission && latestSubmission && solvedSet.size > 0) {
      const days = Math.max(1, Math.ceil((latestSubmission - earliestSubmission) / (1000 * 60 * 60 * 24)));
      avgPerDay = (solvedSet.size / days).toFixed(2);
    }
    problemSolvingData.averagePerDay = avgPerDay;
    student.problemsSolved = solvedSet.size;
    student.problemSolvingData = problemSolvingData;
    student.recentSubmissions = recentSubmissions;
  }
  // 3. Fetch user.rating (contest history)
  const cfRatingRes = await axios.get(`https://codeforces.com/api/user.rating?handle=${student.codeforcesHandle}`);
  if (cfRatingRes.data.status === 'OK' && Array.isArray(cfRatingRes.data.result)) {
    contestHistory = cfRatingRes.data.result.map(contest => ({
      contestId: contest.contestId,
      contestName: contest.contestName,
      rank: contest.rank,
      oldRating: contest.oldRating,
      newRating: contest.newRating,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000)
    }));
    student.contestHistory = contestHistory;
  }
  await student.save();
}

router.put('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

module.exports = router; 