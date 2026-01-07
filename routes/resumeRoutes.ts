import express from 'express';
import { createResume, getResumes, deleteResume, updateResume } from '../controllers/resumeController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// When someone visits /api/resumes:
router.post('/', protect, createResume); 
router.get('/', protect, getResumes);
router.delete('/:id', protect, deleteResume);
router.put('/:id', protect, updateResume);

export default router;
