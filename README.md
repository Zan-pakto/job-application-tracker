# Job Application Tracker

A full-stack web application to help users track job applications and view status changes over time.

## Features

- **Authentication**: JWT-based login and signup system
- **Dashboard**: Add, edit, delete, and view job applications
- **File Upload**: Upload resumes (PDF, DOC, DOCX) for each application
- **Status Tracking**: Track application status (Applied, Interview, Offer, Rejected)
- **Timeline View**: Visual timeline of status changes for each job
- **Filtering**: Filter applications by status
- **Statistics**: Overview of application statistics

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Axios, React Router
- **Backend**: Node.js, Express.js, Mongoose, JWT, Multer, bcryptjs
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS with custom component classes

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

## Quick Start

### Option 1: Start Both Frontend and Backend Together (Recommended)

```bash
# Install all dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

### Option 2: Start Frontend and Backend Separately

```bash
# Install all dependencies
npm run install-all

# Start backend server (Terminal 1)
npm run server

# Start frontend (Terminal 2)
npm run client
```

## Detailed Setup Instructions

### 1. Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- MongoDB (local installation or MongoDB Atlas)

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd "Job Application Tracker"

# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Environment Setup

```bash
# Create environment file
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job-tracker
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### 4. Database Setup

- **Local MongoDB**: Make sure MongoDB is running on your system
- **MongoDB Atlas**: Update `MONGODB_URI` in `.env` with your Atlas connection string

### 5. Start the Application

```bash
# Start both frontend and backend concurrently
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## Troubleshooting

### If `npm start` doesn't work:

This project uses separate scripts for frontend and backend. Use:

- `npm run dev` - Start both together
- `npm run server` - Start only backend
- `npm run client` - Start only frontend

### If MongoDB connection fails:

- Check if MongoDB is running locally
- Verify your MongoDB connection string in `.env`
- For Atlas: Ensure your IP is whitelisted

## Available Scripts

### Root Level Scripts

- `npm run dev` - Start both frontend and backend concurrently
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run install-all` - Install dependencies for root, server, and client

### Client Scripts (in `client/` directory)

- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Server Scripts (in `server/` directory)

- `npm start` - Start Express server
- `npm run dev` - Start with nodemon for development

## Project Structure

```
job-application-tracker/
├── client/                 # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   └── App.js          # Main App component
│   ├── package.json
│   └── tailwind.config.js
├── server/                 # Node.js backend
│   ├── middleware/         # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API routes
│   ├── index.js           # Server entry point
│   ├── package.json
│   └── .env.example
├── uploads/               # Resume file storage
├── package.json           # Root package.json
└── README.md
```

## Getting Started

After starting the application, you can:

1. **Register/Login**: Create a new account or login with existing credentials
2. **Dashboard**: View your job application statistics and overview
3. **Add Applications**: Create new job applications with company details
4. **Upload Resume**: Attach resume files (PDF, DOC, DOCX) to applications
5. **Track Status**: Update application status (Applied → Interview → Offer/Rejected)
6. **View Timeline**: See the history of status changes for each application
7. **Filter & Search**: Filter applications by status or search by company name
8. **Profile Management**: Update your profile information and change password

## Features Overview

- **📊 Dashboard**: Real-time statistics and application overview
- **📝 Job Management**: Add, edit, delete job applications
- **📄 Resume Upload**: Upload and manage resume files
- **📈 Status Tracking**: Track application progress through different stages
- **🔐 Authentication**: Secure JWT-based login system
- **👤 Profile Settings**: Manage personal information and password
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Jobs

- `GET /api/jobs` - Get all jobs for authenticated user
- `POST /api/jobs` - Create new job application
- `PUT /api/jobs/:id` - Update job application
- `DELETE /api/jobs/:id` - Delete job application
- `GET /api/jobs/stats/overview` - Get application statistics
