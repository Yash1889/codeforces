const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendInactivityEmail(student) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: student.email,
    subject: 'Keep Up Your Coding Practice!',
    html: `
      <h1>Hello ${student.name},</h1>
      <p>We noticed that you haven't made any submissions on Codeforces in the last 7 days.</p>
      <p>Remember, consistent practice is key to improving your competitive programming skills!</p>
      <p>Here are some suggestions to get back on track:</p>
      <ul>
        <li>Try solving some problems from your current rating range</li>
        <li>Participate in upcoming Codeforces contests</li>
        <li>Review your previous submissions and learn from them</li>
      </ul>
      <p>Keep coding and keep improving!</p>
      <p>Best regards,<br>TLE Eliminators Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Inactivity email sent to ${student.email}`);
  } catch (error) {
    console.error('Error sending inactivity email:', error);
    throw error;
  }
}

module.exports = {
  sendInactivityEmail
}; 