import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User from '../models/User';

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

export { registerUser, loginUser };
