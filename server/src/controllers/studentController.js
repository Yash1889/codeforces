// ... existing imports and code ...

const Student = require('../models/Student');
const axios = require('axios');

// Add caching for Codeforces problems
let problemsCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Add this new controller method
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .select('name codeforcesHandle currentRating maxRating problemsSolved problemSolvingData recentSubmissions')
      .sort({ currentRating: -1 });
    
    // Process each student's data
    const processedStudents = students.map(student => {
      const studentObj = student.toObject();
      
      // Calculate average problems per day
      if (student.recentSubmissions && student.recentSubmissions.length > 0) {
        const firstSubmission = new Date(student.recentSubmissions[student.recentSubmissions.length - 1].date);
        const lastSubmission = new Date(student.recentSubmissions[0].date);
        const daysDiff = Math.max(1, Math.ceil((lastSubmission - firstSubmission) / (1000 * 60 * 60 * 24)));
        studentObj.problemSolvingData = {
          ...studentObj.problemSolvingData,
          averageProblemsPerDay: (student.problemsSolved / daysDiff).toFixed(2)
        };
      } else {
        studentObj.problemSolvingData = {
          ...studentObj.problemSolvingData,
          averageProblemsPerDay: "0.00"
        };
      }

      // Ensure tagStats exists
      if (!studentObj.problemSolvingData.tagStats) {
        studentObj.problemSolvingData.tagStats = [];
      }

      return studentObj;
    });
    
    res.status(200).json(processedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

exports.getProblemRecommendations = async (req, res) => {
  try {
    console.log('Getting recommendations for student:', req.params.id);
    const student = req.student;
    if (!student) {
      console.log('Student not found in request');
      return res.status(404).json({ message: 'Student not found' });
    }
    console.log('Found student:', student._id);

    // Get student's solved problems
    const solvedProblems = new Set(
      student.recentSubmissions
        .filter(sub => sub.verdict === 'OK')
        .map(sub => `${sub.problem.contestId}${sub.problem.index}`)
    );
    console.log('Solved problems count:', solvedProblems.size);

    // Get student's attempted problems
    const attemptedProblems = new Set(
      student.recentSubmissions
        .map(sub => `${sub.problem.contestId}${sub.problem.index}`)
    );
    console.log('Attempted problems count:', attemptedProblems.size);

    // Get student's tag statistics
    const tagStats = student.problemSolvingData?.tagStats || [];
    const weakTags = tagStats
      .filter(tag => tag.successRate < 50)
      .map(tag => tag.tag);
    console.log('Weak tags:', weakTags);

    // Calculate target rating range
    const currentRating = student.currentRating;
    const targetRating = Math.min(currentRating + 200, 2000);
    const minRating = Math.max(currentRating - 100, 800);
    console.log('Rating range:', { currentRating, targetRating, minRating });

    // Use cached problems or fetch new ones
    let problems = problemsCache;
    if (!problemsCache || !lastCacheUpdate || (Date.now() - lastCacheUpdate > CACHE_DURATION)) {
      try {
        console.log('Fetching problems from Codeforces API');
        const response = await axios.get('https://codeforces.com/api/problemset.problems');
        if (response.data.status === 'OK') {
          problems = response.data.result.problems;
          problemsCache = problems;
          lastCacheUpdate = Date.now();
          console.log('Cached problems count:', problems.length);
        } else {
          throw new Error('Codeforces API returned error status');
        }
      } catch (error) {
        console.error('Error fetching problems from Codeforces:', error);
        // If we have cached problems, use them even if expired
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
    } else {
      console.log('Using cached problems:', problems.length);
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
      }
    ];

    console.log('Generated recommendations:', recommendations.map(r => ({
      title: r.title,
      problemCount: r.problems.length
    })));

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations', error: error.message });
  }
};

// ... rest of the existing code ... 