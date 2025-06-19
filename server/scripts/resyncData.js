const mongoose = require('mongoose');
const { fetchCodeforcesData } = require('../src/services/codeforcesService');
const Student = require('../src/models/Student');
require('dotenv').config();

async function resyncAllStudents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students to resync`);

    // Resync each student
    for (const student of students) {
      try {
        console.log(`Resyncing data for ${student.name} (${student.codeforcesHandle})...`);
        await fetchCodeforcesData(student.codeforcesHandle);
        console.log(`Successfully resynced data for ${student.name}`);
      } catch (error) {
        console.error(`Error resyncing data for ${student.name}:`, error.message);
      }
    }

    console.log('Resync completed');
  } catch (error) {
    console.error('Error during resync:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the resync
resyncAllStudents(); 