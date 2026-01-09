import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import resumeRoutes from './routes/resumeRoutes';

dotenv.config();

connectDB();

const app = express();

// CORS Configuration - Uses FRONTEND_URL from .env
// To switch environments, edit .env file:
//   Local dev: FRONTEND_URL=http://localhost:5173
//   Production: FRONTEND_URL=https://resume-builder-frontend-opal.vercel.app
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/resumes', resumeRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

