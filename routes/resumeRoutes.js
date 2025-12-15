const express = require('express');
const router = express.Router();
const { createResume, getResumes } = require('../controllers/resumeController');

// When someone visits /api/resumes:
router.post('/', createResume); // POST request triggers createResume
router.get('/', getResumes);    // GET request triggers getResumes

module.exports = router;