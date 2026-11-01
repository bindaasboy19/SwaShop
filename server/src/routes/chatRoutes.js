import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage
} from '../controllers/chatController.js';

const router = express.Router();

// All chat endpoints require authenticated user
router.use(authenticate);

router.post('/conversations', getOrCreateConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
