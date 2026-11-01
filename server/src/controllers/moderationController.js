import ModerationReport from '../models/ModerationReport.js';
import AuditLog from '../models/AuditLog.js';
import Product from '../models/Product.js';
import SellerProfile from '../models/SellerProfile.js';
import Review from '../models/Review.js';
import { logAudit } from '../services/auditService.js';

// @desc    Submit a user report against product, seller, or review
// @route   POST /api/moderation/report
// @access  Private
export const submitReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Target type, target ID, and reason are required'
      });
    }

    const report = await ModerationReport.create({
      reporterId: req.user._id,
      targetType,
      targetId,
      reason,
      details: details || '',
      status: 'OPEN'
    });

    await logAudit({
      actorId: req.user._id,
      actorRole: req.user.role,
      action: 'MODERATION_REPORT_SUBMITTED',
      resourceType: targetType,
      resourceId: targetId,
      metadata: { reason },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted for administrative review',
      report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin lists moderation reports
// @route   GET /api/admin/moderation/reports
// @access  Private (Admin)
export const getAdminReports = async (req, res, next) => {
  try {
    const { status = 'OPEN', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      ModerationReport.find(query)
        .populate('reporterId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ModerationReport.countDocuments(query)
    ]);

    res.json({
      success: true,
      reports,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin takes action on a report
// @route   PATCH /api/admin/moderation/reports/:id
// @access  Private (Admin)
export const resolveReport = async (req, res, next) => {
  try {
    const { actionTaken, adminNotes } = req.body;
    const report = await ModerationReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'ACTION_TAKEN';
    report.actionTaken = actionTaken || 'NONE';
    report.adminNotes = adminNotes || '';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();

    // Execute content moderation action
    if (actionTaken === 'CONTENT_REMOVED') {
      if (report.targetType === 'PRODUCT') {
        await Product.findByIdAndUpdate(report.targetId, { isActive: false, isPublished: false });
      } else if (report.targetType === 'REVIEW') {
        await Review.findByIdAndUpdate(report.targetId, { status: 'REMOVED' });
      }
    } else if (actionTaken === 'SELLER_SUSPENDED') {
      await SellerProfile.findByIdAndUpdate(report.targetId, { verificationStatus: 'SUSPENDED', isOpen: false });
    }

    await report.save();

    await logAudit({
      actorId: req.user._id,
      actorRole: 'ADMIN',
      action: `ADMIN_MODERATION_${actionTaken}`,
      resourceType: report.targetType,
      resourceId: report.targetId,
      metadata: { reportId: report._id, actionTaken, adminNotes },
      req
    });

    res.json({
      success: true,
      message: `Report resolved with action: ${actionTaken}`,
      report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin lists immutable audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resourceType, page = 1, limit = 30 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    next(err);
  }
};
