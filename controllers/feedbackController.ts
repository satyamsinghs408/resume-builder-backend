import { Request, Response } from 'express';
import sendEmail from '../utils/sendEmail';
import { feedbackSupportTemplate } from '../utils/emailTemplates';

/**
 * @desc    Handle user feedback
 * @route   POST /api/feedback
 * @access  Public
 */
export const handleFeedback = async (req: Request, res: Response) => {
    const { name, email, type, message } = req.body;

    if (!name || !email || !type || !message) {
        return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    try {
        // Send internal notification to support
        await sendEmail({
            email: process.env.EMAIL_USER!, // Your support inbox
            subject: `[FEEDBACK - ${type.toUpperCase()}] New submission from ${name}`,
            message: `Feedback Type: ${type}\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: feedbackSupportTemplate({ name, email, type, message })
        });

        // Optional: Could send a "Thank you" email to the user here as well
        // But per your request, we are primarily focusing on getting the data to support.

        res.status(200).json({ success: true, message: 'Feedback received successfully' });
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({ success: false, message: 'Failed to process feedback' });
    }
};
