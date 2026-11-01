import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllRead,
  getPreferences,
  updatePreferences
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getMyNotifications);
router.patch('/read-all', requireAuth, markAllRead);
router.patch('/:id/read', requireAuth, markAsRead);
router.get('/preferences', requireAuth, getPreferences);
router.put('/preferences', requireAuth, updatePreferences);

export default router;
