const axios = require('axios');

const CODEFORCES_API_URL = process.env.CODEFORCES_API_URL;

const fetchUserInfo = async (handle) => {
  try {
    const response = await axios.get(`${CODEFORCES_API_URL}/user.info`, {
      params: { handles: handle },
    });
    return response.data.result[0];
  } catch (error) {
    throw new Error(`Failed to fetch user info: ${error.message}`);
  }
};

const fetchUserRating = async (handle) => {
  try {
    const response = await axios.get(`${CODEFORCES_API_URL}/user.rating`, {
      params: { handle },
    });
    return response.data.result;
  } catch (error) {
    throw new Error(`Failed to fetch user rating: ${error.message}`);
  }
};

const fetchUserSubmissions = async (handle, count = 1000) => {
  try {
    const response = await axios.get(`${CODEFORCES_API_URL}/user.status`, {
      params: { handle, count },
    });
    return response.data.result;
  } catch (error) {
    throw new Error(`Failed to fetch user submissions: ${error.message}`);
  }
};

const processContestData = (ratingHistory) => {
  return ratingHistory.map(contest => ({
    contestId: contest.contestId,
    contestName: contest.contestName,
    rank: contest.rank,
    oldRating: contest.oldRating,
    newRating: contest.newRating,
    date: new Date(contest.ratingUpdateTimeSeconds * 1000),
  }));
};

const processSubmissionData = (submissions) => {
  return submissions.map(submission => ({
    problemId: submission.problem.contestId + submission.problem.index,
    problemName: submission.problem.name,
    problemRating: submission.problem.rating || 0,
    verdict: submission.verdict,
    date: new Date(submission.creationTimeSeconds * 1000),
  }));
};

const getUnsolvedProblems = (submissions) => {
  const solvedProblems = new Set();
  const attemptedProblems = new Set();

  submissions.forEach(submission => {
    const problemId = submission.problem.contestId + submission.problem.index;
    if (submission.verdict === 'OK') {
      solvedProblems.add(problemId);
    } else {
      attemptedProblems.add(problemId);
    }
  });

  return Array.from(attemptedProblems).filter(problemId => !solvedProblems.has(problemId));
};

module.exports = {
  fetchUserInfo,
  fetchUserRating,
  fetchUserSubmissions,
  processContestData,
  processSubmissionData,
  getUnsolvedProblems,
}; 