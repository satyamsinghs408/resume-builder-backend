const Resume = require('../models/Resume');

// @desc    Create a new resume
// @route   POST /api/resumes
const createResume = async (req, res) => {
    try {
        // 1. Get data from the frontend (request body)
        const { firstName, lastName, email, address, phone } = req.body;

        // 2. Create a new Resume object
        const newResume = new Resume({
            firstName,
            lastName,
            email,
            address,
            phone
        });

        // 3. Save it to MongoDB
        const savedResume = await newResume.save();

        // 4. Send the saved data back as a response
        res.status(201).json(savedResume);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all resumes
// @route   GET /api/resumes
const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find(); // Fetch all documents
        res.status(200).json(resumes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createResume, getResumes };