import express from 'express';
import { handleContactForm } from '../controllers/contactController';

const router = express.Router();

// @route   POST /api/contact
// @desc    Handle contact form submissions
// @access  Public
router.post('/', handleContactForm);

export default router;
