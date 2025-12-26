const express = require('express');
const router = express.Router();
const { createResume, getResumes, deleteResume, updateResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// When someone visits /api/resumes:
router.post('/', protect, createResume); 
router.get('/', protect, getResumes);
router.delete('/:id', protect, deleteResume);
router.put('/:id', protect, updateResume);

module.exports = router;