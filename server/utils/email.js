const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendInactivityReminder = async (student) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: student.email,
    subject: 'Reminder: Get Back to Problem Solving!',
    html: `
      <h2>Hello ${student.name},</h2>
      <p>We noticed that you haven't made any submissions on Codeforces in the last 7 days.</p>
      <p>Keep up the good work and continue your problem-solving journey!</p>
      <p>Your current rating: ${student.currentRating}</p>
      <p>Your max rating: ${student.maxRating}</p>
      <p>Visit Codeforces: <a href="https://codeforces.com">https://codeforces.com</a></p>
      <br>
      <p>Best regards,</p>
      <p>Student Progress Management System</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendInactivityReminder,
}; 