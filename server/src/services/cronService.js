const cron = require('node-cron');
const Student = require('../models/Student');
const { fetchCodeforcesData } = require('./codeforcesService');

// Default schedule: Run at 2 AM every day
let cronSchedule = '0 2 * * *';

function startCronJob() {
  // Stop any existing cron job
  stopCronJob();

  // Start new cron job
  cron.schedule(cronSchedule, async () => {
    console.log('Running daily Codeforces data sync...');
    try {
      const students = await Student.find({});
      
      for (const student of students) {
        try {
          await fetchCodeforcesData(student.codeforcesHandle);
          console.log(`Updated data for student: ${student.name}`);
        } catch (error) {
          console.error(`Error updating data for student ${student.name}:`, error);
        }
      }
      
      console.log('Daily sync completed successfully');
    } catch (error) {
      console.error('Error in daily sync:', error);
    }
  });
}

function stopCronJob() {
  cron.getTasks().forEach(task => task.stop());
}

function updateCronSchedule(newSchedule) {
  if (!cron.validate(newSchedule)) {
    throw new Error('Invalid cron schedule');
  }
  cronSchedule = newSchedule;
  startCronJob();
}

module.exports = {
  startCronJob,
  stopCronJob,
  updateCronSchedule
}; 