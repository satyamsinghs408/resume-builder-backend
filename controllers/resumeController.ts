import { Request, Response } from 'express';
import Resume from '../models/Resume';
import { AuthRequest } from '../types';
import * as fs from 'fs';

// @desc    Parse Resume PDF
// @route   POST /api/resumes/parse
// @access  Public
export const parseResume = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    // Standard pdf-parse v1 usage
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // --- HEURISTIC PARSING LOGIC ---
    // 1. Email
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';
    
    // 2. Phone
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';

    // 3. Name (Heuristic)
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    const potentialName = lines[0] || '';
    const nameParts = potentialName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // 4. Experience (Heuristic - Dummy)
    let experience = [];
    const expIndex = text.toLowerCase().indexOf('experience');
    if (expIndex !== -1) {
        const expText = text.substring(expIndex, expIndex + 500); 
        experience.push({
            title: "Imported Role",
            company: "See Description",
            description: expText.substring(0, 200) + "..." 
        });
    } else {
        experience.push({ title: '', company: '', description: '' });
    }

    // Clean up
    fs.unlinkSync(req.file.path);

    res.json({
      firstName,
      lastName,
      email,
      phone,
      address: '', 
      experience,
      education: [{ school: '', degree: '', year: '' }]
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ message: 'Failed to parse resume', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// @desc    Create a new resume
// @route   POST /api/resumes
const createResume = async (req: AuthRequest, res: Response) => {
    try {
        const { firstName, lastName, email, address, phone, experience, education } = req.body;

        // CRITICAL CHECK: Did the middleware work?
        if (!req.user) {
             return res.status(401).json({ message: "User not found in request" });
        }

        const newResume = new Resume({
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
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all resumes
// @route   GET /api/resumes
const getResumes = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authorized' });
        
        // Find resumes where the 'user' field matches the logged-in user's ID
        const resumes = await Resume.find({ user: req.user._id });
        
        res.status(200).json(resumes);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
const deleteResume = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authorized' });

        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }

        // Security Check: Ensure the user owns this resume
        if (resume.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }


        await resume.deleteOne();
        res.status(200).json({ message: 'Resume removed' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an existing resume
// @route   PUT /api/resumes/:id
const updateResume = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authorized' });

        const { firstName, lastName, email, address, phone, experience, education } = req.body;

        // 1. Find the resume
        const resume = await Resume.findById(req.params.id);

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

    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Don't forget to export it!
export { createResume, getResumes, deleteResume, updateResume };
