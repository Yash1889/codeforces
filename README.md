# TLE Eliminators - Student Progress Management System

A comprehensive system to track and manage student progress on Codeforces.

## Features

- Student Management (CRUD operations)
- Codeforces Progress Tracking
- Contest History Visualization
- Problem Solving Analytics
- Automated Data Synchronization
- Inactivity Detection & Email Notifications
- Responsive Design with Light/Dark Mode

## Tech Stack

- Frontend: React.js, Material-UI, Chart.js
- Backend: Node.js, Express.js
- Database: MongoDB
- Additional: Codeforces API, Nodemailer, Node-cron

## Project Structure

```
TLE-ELIMINATORS/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create .env file with required environment variables
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
MONGODB_URI=your_mongodb_uri
PORT=5000
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

## API Documentation

Detailed API documentation will be available at `/api-docs` when the server is running.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 