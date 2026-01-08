import express from 'express';
import multer from 'multer';
import { parseResume } from '../controllers/resumeController';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Existing routes (placeholders if you had them, or just this one for now)
// router.post('/', createResume); 
// router.get('/:id', getResume);

// New Parsing Route
router.post('/parse', upload.single('resume'), parseResume);

export default router;
