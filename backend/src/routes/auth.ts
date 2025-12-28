import express from 'express';
import { registerUser, loginUser, updateProfile, getProfile } from '../controllers/auth';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', updateProfile);
router.get('/profile', getProfile);

export default router;
