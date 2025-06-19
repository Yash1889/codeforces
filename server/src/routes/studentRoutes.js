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
router.get('/', protect, async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
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
    res.status(200).json(student);
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