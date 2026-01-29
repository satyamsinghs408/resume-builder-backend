import { Request, Response } from 'express';
import Resume from '../models/Resume';
import { AuthRequest } from '../types';
import * as fs from 'fs';

import { parseResumeWithAI } from '../services/aiService';

// @desc    Parse Resume PDF
// @route   POST /api/resumes/parse
// @access  Public
export const parseResume = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Use AI Service to parse the text
    // Use AI Service to parse the text
    const parsedData = await parseResumeWithAI(text);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return the structured data directly
    res.json(parsedData);

  } catch (error) {
    console.error('Error parsing PDF:', error);
    
    // Clean up file if it exists and error occurred
    if (req.file && fs.existsSync(req.file.path)) {
       fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Failed to parse resume', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// @desc    Create a new resume
// @route   POST /api/resumes
const createResume = async (req: AuthRequest, res: Response) => {
    try {
        const { 
            firstName, lastName, email, address, phone, summary,
            socialLinks, experience, education, skills, projects, certifications, languages 
        } = req.body;

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
            summary,
            socialLinks,
            experience,
            education,
            skills,
            projects,
            certifications,
            languages
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

        const { 
            firstName, lastName, email, address, phone, summary,
            socialLinks, experience, education, skills, projects, certifications, languages 
        } = req.body;

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
        resume.summary = summary || resume.summary;
        resume.socialLinks = socialLinks || resume.socialLinks;
        resume.experience = experience || resume.experience;
        resume.education = education || resume.education;
        resume.skills = skills || resume.skills;
        resume.projects = projects || resume.projects;
        resume.certifications = certifications || resume.certifications;
        resume.languages = languages || resume.languages;

        const updatedResume = await resume.save();
        res.json(updatedResume);

    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

// Don't forget to export it!
export { createResume, getResumes, deleteResume, updateResume };
