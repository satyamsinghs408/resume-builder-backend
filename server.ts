import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';

// Import Routes
import resumeRoutes from './routes/resumeRoutes';
import userRoutes from './routes/userRoutes';


dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount the Routes
app.use('/api/resumes', resumeRoutes);
app.use('/api/users', userRoutes);

// Default Route
app.get('/', (req: Request, res: Response) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
