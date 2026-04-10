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

    // Custom render function to extract hidden hyperlinks from the PDF
    const render_page = async function(pageData: any) {
        let textContent = await pageData.getTextContent();
        let annotations = await pageData.getAnnotations();
        
        let text = textContent.items.map((item: any) => item.str).join(' ');
        
        // Grab hidden links and append them to the text so AI can see them
        let links = annotations
            .filter((a: any) => a.subtype === 'Link' && a.url)
            .map((a: any) => a.url)
            .join(', ');
            
        if (links) {
            text += '\n[Embedded Links Found on this Page: ' + links + ']\n';
        }
        
        return text;
    };

    const data = await pdfParse(dataBuffer, { pagerender: render_page });
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

        // Send confirmation email
        try {
            const sendEmail = (await import('../utils/sendEmail')).default;
            const { wrapPremiumTemplate } = await import('../utils/emailTemplates');
            
            await sendEmail({
                email: savedResume.email || req.user.email,
                subject: 'Your CareerLeaf Resume is Ready!',
                message: `Hi ${savedResume.firstName},\n\nYour professional resume has been successfully created on CareerLeaf. You can view and edit it anytime from your dashboard.`,
                html: wrapPremiumTemplate({
                    tagline: 'Document Saved',
                    title: 'Your Professional Resume is Ready!',
                    content: `
                        <p>Hi <strong>${savedResume.firstName}</strong>,</p>
                        <p>Great news! Your professional resume was successfully created and optimized for your next career move.</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-weight: bold; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Draft Details</p>
                            <div style="margin-top: 12px; font-size: 15px;">
                                <div style="display: flex; margin-bottom: 4px;"><span style="color: #64748b; width: 100px;">Name:</span> <span style="color: #0f172a;">${savedResume.firstName} ${savedResume.lastName}</span></div>
                                <div style="display: flex;"><span style="color: #64748b; width: 100px;">Created:</span> <span style="color: #0f172a;">${new Date().toLocaleDateString()}</span></div>
                            </div>
                        </div>
                        <p>You can now download your resume in multiple formats or continue editing your professional profile from your dashboard.</p>
                    `,
                    buttonText: 'Access My Dashboard',
                    buttonUrl: `${process.env.FRONTEND_URL}/dashboard`,
                    footerText: 'Your professional growth is our mission. Access your documents at any time at CareerLeaf.app'
                })
            });
        } catch (err) {
            console.error('Resume creation email failed:', err);
        }

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
