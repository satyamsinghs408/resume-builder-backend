import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../models/User';
import Resume from '../models/Resume';
import { AuthRequest } from '../types';
import sendEmail from '../utils/sendEmail';
import { passwordChangedTemplate, accountDeletedTemplate } from '../utils/emailTemplates';

// Helper function to generate JWT Token
const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/users/register
const registerUser = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
        // 1. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        if (user) {
            // Optional: Send Welcome Email
            try {
                const { wrapPremiumTemplate } = await import('../utils/emailTemplates');
                
                sendEmail({
                    email: user.email,
                    subject: 'Welcome to CareerLeaf!',
                    message: `Hi ${user.name},\n\nWelcome to CareerLeaf! We're excited to help you build your professional resume.`,
                    html: wrapPremiumTemplate({
                        tagline: 'Your Journey Starts Here',
                        title: `Welcome to CareerLeaf, ${user.name}!`,
                        content: `
                            <p>We're thrilled to have you join our community of professionals. CareerLeaf is designed to help you stand out in the modern job market with world-class resume building tools.</p>
                            <p>Whether you're starting from scratch or refining an existing career path, we're here to provide the architect's tools for your success.</p>
                        `,
                        buttonText: 'Start Building Your Resume',
                        buttonUrl: `${process.env.FRONTEND_URL}/editor`,
                        footerText: 'Thank you for choosing CareerLeaf to design your professional identity.'
                    })
                });
            } catch (err) {
                console.error('Welcome email failed to send:', err);
            }

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id), // Send the token right away
            });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // 1. Check for user email
        const user = await User.findOne({ email });

        // 2. Check password
        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        // req.user is already populated by protect middleware
        res.json(req.user);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/users/profile/password
// @access  Private
const changePassword = async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user._id);

        if (user && user.password && (await bcrypt.compare(currentPassword, user.password))) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();

            // Send confirmation email
            sendEmail({
                email: user.email,
                subject: 'Security Alert: Password Changed',
                message: `Hi ${user.name}, your account password was successfully updated.`,
                html: passwordChangedTemplate(user.name)
            });

            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user account
// @route   DELETE /api/users/profile
// @access  Private
const deleteAccount = async (req: AuthRequest, res: Response) => {
    const { password } = req.body;

    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(req.user._id);

        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            // 1. Delete all resumes associated with this user
            await Resume.deleteMany({ user: user._id });

            // 2. Delete the user
            await user.deleteOne();

            // 3. Send goodbye email
            sendEmail({
                email: user.email,
                subject: 'Account Permanently Deleted',
                message: `Hi ${user.name}, your account has been removed. We're sorry to see you go!`,
                html: accountDeletedTemplate(user.name)
            });

            res.json({ message: 'Account and all data deleted successfully' });
        } else {
            res.status(401).json({ message: 'Invalid password. Deletion aborted.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export { registerUser, loginUser, getUserProfile, changePassword, deleteAccount };
