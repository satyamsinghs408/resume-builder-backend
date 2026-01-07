"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
// Helper function to generate JWT Token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};
// @desc    Register new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // 1. Check if user already exists
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // 2. Hash the password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // 3. Create user
        const user = await User_1.default.create({
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
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid user data' });
    }
};
exports.registerUser = registerUser;
// @desc    Authenticate a user
// @route   POST /api/users/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Check for user email
        const user = await User_1.default.findOne({ email });
        // 2. Check password
        if (user && user.password && (await bcryptjs_1.default.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user.id),
            });
        }
        else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.loginUser = loginUser;
