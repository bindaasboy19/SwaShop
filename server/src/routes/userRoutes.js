import express from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;
