require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { syncStudentData } = require('./cron/syncData');
const Student = require('./src/models/Student');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB for sync');
    const student = await Student.findOne({ codeforcesHandle: 'yash_fsoc' });

    if (student) {
      await syncStudentData(student);
      console.log('Codeforces data sync initiated for yash_fsoc');
    } else {
      console.log('Student with handle yash_fsoc not found.');
    }
    mongoose.connection.close();
  })
  .catch(err => console.error('MongoDB connection error during sync:', err)); 