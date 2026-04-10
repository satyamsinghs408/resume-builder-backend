import express from 'express';
import { handleFeedback } from '../controllers/feedbackController';

const router = express.Router();

// @route   POST /api/feedback
// @desc    Receive user feedback and email it to support
// @access  Public
router.post('/', handleFeedback);

export default router;
