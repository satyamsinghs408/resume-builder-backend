const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const resumeRoutes = require('./routes/resumeRoutes'); // <--- ADD THIS
const userRoutes = require('./routes/userRoutes');


dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Mount the Routes
app.use('/api/resumes', resumeRoutes); // <--- ADD THIS
app.use('/api/users', userRoutes); // <--- ADD THIS
app.use('/api/resumes', resumeRoutes);


// Default Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});