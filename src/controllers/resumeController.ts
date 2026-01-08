import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import fs from 'fs';

export const parseResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    // --- HEURISTIC PARSING LOGIC ---
    // 1. Email
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';
    
    // 2. Phone (basic regex, can be improved)
    // Looks for patterns like (123) 456-7890 or 123-456-7890 or +1 123 456 7890
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';

    // 3. Name (Very hard to guess, usually first lines)
    // We take the first non-empty line as a guess
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const potentialName = lines[0] || '';
    const nameParts = potentialName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // 4. Experience (Naive keyword search)
    // We look for "Experience" or "Work History" and take the next chunk of text
    let experience = [];
    const expIndex = text.toLowerCase().indexOf('experience');
    if (expIndex !== -1) {
        // Just a dummy extraction for now to show it "works"
        // In a real app, we'd need an NLP model or clearer delimiters
        const expText = text.substring(expIndex, expIndex + 500); // Grab 500 chars after "Experience"
        experience.push({
            title: "Imported Role",
            company: "See Description",
            description: expText.substring(0, 200) + "..." // Truncate
        });
    } else {
        experience.push({ title: '', company: '', description: '' });
    }

    // Clean up file
    fs.unlinkSync(req.file.path);

    res.json({
      firstName,
      lastName,
      email,
      phone,
      address: '', // Hard to parse address reliably
      experience,
      education: [{ school: '', degree: '', year: '' }] // Hard to parse education reliably without NLP
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ message: 'Failed to parse resume' });
  }
};
