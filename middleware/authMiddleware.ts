import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';


const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    // 1. Check if the header has "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Split "Bearer" from "eyJ...")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // Get user from the token ID (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            next(); // Pass control to the next function (the controller)
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export { protect };
