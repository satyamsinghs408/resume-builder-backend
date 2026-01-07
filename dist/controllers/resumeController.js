"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateResume = exports.deleteResume = exports.getResumes = exports.createResume = void 0;
const Resume_1 = __importDefault(require("../models/Resume"));
// @desc    Create a new resume
// @route   POST /api/resumes
const createResume = async (req, res) => {
    try {
        const { firstName, lastName, email, address, phone, experience, education } = req.body;
        // CRITICAL CHECK: Did the middleware work?
        if (!req.user) {
            return res.status(401).json({ message: "User not found in request" });
        }
        const newResume = new Resume_1.default({
            user: req.user._id, // <--- THIS IS NEW (Links resume to the logged-in user)
            firstName,
            lastName,
            email,
            address,
            phone,
            experience,
            education
        });
        const savedResume = await newResume.save();
        res.status(201).json(savedResume);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.createResume = createResume;
// @desc    Get all resumes
// @route   GET /api/resumes
const getResumes = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Not authorized' });
        // Find resumes where the 'user' field matches the logged-in user's ID
        const resumes = await Resume_1.default.find({ user: req.user._id });
        res.status(200).json(resumes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getResumes = getResumes;
// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
const deleteResume = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Not authorized' });
        const resume = await Resume_1.default.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        // Security Check: Ensure the user owns this resume
        if (resume.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await resume.deleteOne();
        res.status(200).json({ message: 'Resume removed' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.deleteResume = deleteResume;
// @desc    Update an existing resume
// @route   PUT /api/resumes/:id
const updateResume = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Not authorized' });
        const { firstName, lastName, email, address, phone, experience, education } = req.body;
        // 1. Find the resume
        const resume = await Resume_1.default.findById(req.params.id);
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        // 2. Check ownership (Security)
        if (resume.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        // 3. Update fields
        resume.firstName = firstName || resume.firstName;
        resume.lastName = lastName || resume.lastName;
        resume.email = email || resume.email;
        resume.phone = phone || resume.phone;
        resume.address = address || resume.address;
        resume.experience = experience || resume.experience;
        resume.education = education || resume.education;
        const updatedResume = await resume.save();
        res.json(updatedResume);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.updateResume = updateResume;
