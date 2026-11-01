import express from 'express';
import {
  submitReport,
  getAdminReports,
  resolveReport,
  getAuditLogs
} from '../controllers/moderationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// User report submission
router.post('/report', requireAuth, submitReport);

// Admin moderation endpoints
router.get('/admin/reports', requireAuth, requireAdmin, getAdminReports);
router.patch('/admin/reports/:id', requireAuth, requireAdmin, resolveReport);
router.get('/admin/audit-logs', requireAuth, requireAdmin, getAuditLogs);

export default router;
