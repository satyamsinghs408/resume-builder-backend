"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeController_1 = require("../controllers/resumeController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// When someone visits /api/resumes:
router.post('/', authMiddleware_1.protect, resumeController_1.createResume);
router.get('/', authMiddleware_1.protect, resumeController_1.getResumes);
router.delete('/:id', authMiddleware_1.protect, resumeController_1.deleteResume);
router.put('/:id', authMiddleware_1.protect, resumeController_1.updateResume);
exports.default = router;
