import express from 'express';
import { createResume, getResumes, deleteResume, updateResume, parseResume } from '../controllers/resumeController';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// When someone visits /api/resumes:
router.post('/parse', upload.single('resume'), parseResume);
router.post('/', protect, createResume); 
router.get('/', protect, getResumes);
router.delete('/:id', protect, deleteResume);
router.put('/:id', protect, updateResume);

export default router;
