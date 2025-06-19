const cron = require('node-cron');
const Student = require('../src/models/Student');
const {
  fetchUserInfo,
  fetchUserRating,
  fetchUserSubmissions,
  processContestData,
  processSubmissionData,
  getUnsolvedProblems,
} = require('../utils/codeforces');
const { sendInactivityReminder } = require('../utils/email');

const syncStudentData = async (student) => {
  try {
    // Fetch latest data from Codeforces
    const [userInfo, ratingHistory, submissions] = await Promise.all([
      fetchUserInfo(student.codeforcesHandle),
      fetchUserRating(student.codeforcesHandle),
      fetchUserSubmissions(student.codeforcesHandle),
    ]);

    // Process and update student data
    const processedContestData = processContestData(ratingHistory);
    const processedSubmissionData = processSubmissionData(submissions);
    const unsolvedProblems = getUnsolvedProblems(submissions);

    // Update student document
    student.currentRating = userInfo.rating || 0;
    student.maxRating = userInfo.maxRating || 0;
    student.contestHistory = processedContestData;
    student.submissions = processedSubmissionData;
    student.lastUpdated = new Date();
    student.lastSubmissionDate = submissions.length > 0
      ? new Date(submissions[0].creationTimeSeconds * 1000)
      : null;

    // Check for inactivity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (
      student.emailNotifications &&
      student.lastSubmissionDate &&
      student.lastSubmissionDate < sevenDaysAgo
    ) {
      const emailSent = await sendInactivityReminder(student);
      if (emailSent) {
        student.reminderEmailCount += 1;
      }
    }

    await student.save();
    console.log(`Successfully synced data for ${student.name}`);
  } catch (error) {
    console.error(`Error syncing data for ${student.name}:`, error);
  }
};

const startSyncCron = () => {
  // Run at 2 AM daily
  cron.schedule(process.env.CRON_SCHEDULE, async () => {
    console.log('Starting daily data sync...');
    const students = await Student.find();
    
    for (const student of students) {
      await syncStudentData(student);
    }
    
    console.log('Daily data sync completed');
  });
};

module.exports = {
  startSyncCron,
  syncStudentData, // Export for manual sync
}; 