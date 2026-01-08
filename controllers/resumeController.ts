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
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // Split into lines for processing
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    // --- SMART PARSING LOGIC ---

    // 1. Email - find email pattern anywhere
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';

    // 2. Phone - handle Indian format (+91) and others
    const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0].trim() : '';

    // 3. Name - first meaningful line (usually the name is in first 3 lines)
    let firstName = '';
    let lastName = '';
    
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      // Skip lines with email, phone, urls, or section headers
      if (emailRegex.test(line) || phoneRegex.test(line) || 
          /linkedin|github|portfolio|http|www\./i.test(line) ||
          /^(professional|summary|objective|contact|resume|cv)/i.test(line)) {
        continue;
      }
      // Name is typically 2-4 words, all letters
      const words = line.split(/\s+/).filter((w: string) => w.length > 0);
      if (words.length >= 1 && words.length <= 4 && 
          words.every((w: string) => /^[A-Za-z.'-]+$/.test(w)) &&
          line.length < 50) {
        firstName = words[0] || '';
        lastName = words.slice(1).join(' ') || '';
        break;
      }
    }

    // Helper: Find section boundaries
    const findSectionStart = (text: string, patterns: RegExp[]): number => {
      for (const pattern of patterns) {
        const match = text.search(pattern);
        if (match !== -1) return match;
      }
      return -1;
    };

    // Date pattern - captures FULL date ranges like "Aug. 2025 – Present" or "2021 – 2024"
    // Order matters: try full range first, then single date
    const datePatternFull = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|present|current)|(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}/gi;
    const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)/i;

    // 4. EXPERIENCE PARSING
    let experience: Array<{title: string, company: string, description: string}> = [];
    
    const expStart = findSectionStart(text.toLowerCase(), [
      /\bexperience\b/, /\bwork\s*history\b/, /\bemployment\b/, /\bprofessional\s*experience\b/
    ]);
    
    if (expStart !== -1) {
      const afterExp = text.substring(expStart);
      // Find next major section
      const nextSection = afterExp.substring(50).search(/\n\s*(projects?|education|skills|certifications?|achievements?)\s*\n/i);
      const expSection = nextSection !== -1 
        ? afterExp.substring(0, nextSection + 50)
        : afterExp.substring(0, 2500);
      
      const expLines = expSection.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      
      let currentExp: {title: string, company: string, description: string} | null = null;
      let descLines: string[] = [];
      
      for (let i = 1; i < expLines.length; i++) {
        const line = expLines[i];
        
        // Skip bullet points for now (will add to description)
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          if (currentExp) {
            descLines.push(line.replace(/^[•\-*]\s*/, ''));
          }
          continue;
        }
        
        // Check if line contains a date (indicates job title or company line)
        const hasDate = datePattern.test(line);
        
        // Job title markers
        const jobTitleKeywords = /\b(developer|engineer|intern|manager|lead|analyst|designer|architect|consultant|specialist|coordinator|officer|executive|director|associate|trainee|assistant)\b/i;
        
        // Company indicators
        const companyKeywords = /\b(pvt|ltd|llc|inc|corp|company|technologies|solutions|software|systems|consulting|services|global|digital)\b/i;
        const locationPattern = /,\s*[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)?$/; // "City, State" pattern
        
        // If line has date AND job title keyword -> it's a job title
        if (hasDate && jobTitleKeywords.test(line)) {
          // Save previous experience
          if (currentExp && currentExp.title) {
            currentExp.description = descLines.slice(0, 5).join(' ').substring(0, 400);
            experience.push({ ...currentExp });
            descLines = [];
          }
          // Extract just the title part (remove ALL date fragments)
          let titlePart = line;
          // Remove full date ranges first
          titlePart = titlePart.replace(datePatternFull, '').trim();
          // Clean up any remaining date fragments
          titlePart = titlePart.replace(/[-–—]\s*$/g, '').trim();
          currentExp = { title: titlePart, company: '', description: '' };
        }
        // If we have current exp without company, and this line looks like company
        else if (currentExp && !currentExp.company && 
                 (companyKeywords.test(line) || locationPattern.test(line) || line.length < 60)) {
          // This is likely the company line (without date, after title)
          if (!hasDate && !line.startsWith('•') && line.length > 3) {
            currentExp.company = line.replace(locationPattern, '').trim();
          }
        }
        // Regular description line
        else if (currentExp && line.length > 20) {
          descLines.push(line);
        }
      }
      
      // Don't forget the last entry
      if (currentExp && currentExp.title) {
        currentExp.description = descLines.slice(0, 5).join(' ').substring(0, 400);
        experience.push(currentExp);
      }
    }
    
    // If no experience found, add placeholder
    if (experience.length === 0) {
      experience.push({ title: '', company: '', description: '' });
    }

    // 5. EDUCATION PARSING
    let education: Array<{school: string, degree: string, year: string}> = [];
    
    const eduStart = findSectionStart(text.toLowerCase(), [
      /\beducation\b/, /\bacademic\b/, /\bqualification/
    ]);
    
    if (eduStart !== -1) {
      const afterEdu = text.substring(eduStart);
      // More permissive section boundary - don't require newlines around section name
      const nextSection = afterEdu.substring(20).search(/\n\s*(experience|projects?|skills|certifications?|technical)/i);
      const eduSection = nextSection !== -1 
        ? afterEdu.substring(0, nextSection + 20) 
        : afterEdu.substring(0, 1000);
      
      const eduLines = eduSection.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      
      // Patterns
      const schoolPattern = /\b(university|college|institute|school|academy|board)\b/i;
      const degreePatterns = /\b(bachelor|master|phd|doctorate|associate|diploma|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|b\.?\s?s\.?|m\.?\s?s\.?|b\.?\s?a\.?|m\.?\s?a\.?|b\.?\s?sc|m\.?\s?sc|bca|mca|bba|mba|engineering|computer\s*science|technology)\b/i;
      const yearPattern = /\b(19|20)\d{2}\b/g;
      
      let currentEdu: {school: string, degree: string, year: string} | null = null;
      
      for (let i = 1; i < eduLines.length && education.length < 5; i++) {
        const line = eduLines[i];
        const years = line.match(yearPattern);
        const lastYear = years ? years[years.length - 1] : '';
        
        const isSchool = schoolPattern.test(line);
        const isDegree = degreePatterns.test(line);
        
        // Lines with schools
        if (isSchool) {
          if (currentEdu && currentEdu.school) {
            education.push({ ...currentEdu });
          }
          // Extract school name (before location if present)
          const cleanSchool = line.replace(/,\s*[A-Za-z\s]+(?:,\s*[A-Za-z\s]+)?$/, '').trim();
          currentEdu = { school: cleanSchool, degree: '', year: lastYear };
        }
        // Lines with degree info
        else if (isDegree && currentEdu) {
          // Extract degree (before CGPA/GPA if present)
          const cleanDegree = line.replace(/\(.*?\)/g, '').replace(yearPattern, '').trim();
          currentEdu.degree = cleanDegree;
          if (lastYear) currentEdu.year = lastYear;
        }
        // If we see a year and have current edu, update year
        else if (lastYear && currentEdu && !currentEdu.year) {
          currentEdu.year = lastYear;
        }
      }
      
      // Don't forget last education entry
      if (currentEdu && currentEdu.school) {
        education.push(currentEdu);
      }
    }
    
    // If no education found, add placeholder
    if (education.length === 0) {
      education.push({ school: '', degree: '', year: '' });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      firstName,
      lastName,
      email,
      phone,
      address: '',
      experience,
      education
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
