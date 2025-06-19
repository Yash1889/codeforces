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
3. Create .env file with required environment variables (see below)
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

### Backend (.env in server/)
```
MONGO_URI=your_mongodb_uri
PORT=5000
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=your_email
CODEFORCES_API_URL=https://codeforces.com/api
CRON_SCHEDULE=0 2 * * *
```

### Frontend (optional, only for separate deployment)
If you deploy the frontend separately (e.g., on Vercel, Netlify, or as a separate Render service), set this in your frontend environment:
```
REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com/api
```
If the frontend is served by the backend (single Render service), you do **not** need to set this variable.

## Deployment on Render

### Single Service (Backend serves Frontend)
- Build your React app (`npm run build` in `client/`), then serve the build folder from your Express backend.
- Deploy the backend to Render as a web service.
- All API calls use the relative `/api` path and will work out of the box.

### Separate Frontend and Backend Services
- Deploy both `client` and `server` as separate web services on Render.
- Set `REACT_APP_API_BASE_URL` in the frontend Render service to your backend's Render URL (e.g., `https://your-backend-url.onrender.com/api`).
- Make sure CORS in your backend allows your frontend's domain.

## Usage
- Visit your deployed site (e.g., `https://your-app.onrender.com`).
- Add, view, and manage students. All Codeforces data will sync automatically.
- If you see errors about duplicate emails or handles, use unique values for each student.

## Troubleshooting
- **API errors or blank data:** Check that your environment variables are set correctly and that the frontend is using the correct API base URL.
- **CORS errors:** Make sure your backend CORS settings allow your frontend's domain.
- **Render not redeploying:** Push your code to the correct branch on GitHub. Trigger a manual deploy from the Render dashboard if needed.
- **Codeforces sync 404:** Make sure your frontend uses `/students/sync/handle/:handle` for syncing, not `/codeforces/sync/:handle`.

## API Documentation

Detailed API documentation will be available at `/api-docs` when the server is running.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 