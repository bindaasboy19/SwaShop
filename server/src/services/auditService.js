import AuditLog from '../models/AuditLog.js';

/**
 * Log sensitive operational or administrative actions to an append-only collection
 */
export const logAudit = async ({
  actorId = null,
  actorRole = 'SYSTEM',
  action,
  resourceType,
  resourceId = '',
  metadata = {},
  req = null
}) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '';
    const userAgent = req?.headers?.['user-agent'] || '';

    await AuditLog.create({
      actorId,
      actorRole,
      action,
      resourceType,
      resourceId: String(resourceId || ''),
      metadata,
      ipAddress,
      userAgent
    });
  } catch (err) {
    // Non-blocking error logging for audit
    console.error('[AuditService] Failed to record audit log:', err.message);
  }
};
