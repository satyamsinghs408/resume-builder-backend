import express from 'express';
import { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    changePassword, 
    deleteAccount 
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile/password', protect, changePassword);
router.delete('/profile', protect, deleteAccount);

export default router;
