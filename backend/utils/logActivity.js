const ActivityLog = require('../models/ActivityLog');

/**
 * Record who performed an action. Fire-and-forget — never throws to callers.
 * @param {import('express').Request} req
 * @param {object} data
 * @param {import('mongoose').Document|null} [userOverride] - e.g. on login before req.user exists
 */
const logActivity = async (req, data, userOverride = null) => {
  try {
    const user = userOverride || req.user;
    const ip =
      (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
      req.ip ||
      '';

    await ActivityLog.create({
      user: user?._id || null,
      userName: user?.name,
      userEmail: user?.email,
      userRole: user?.role,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId || null,
      entityLabel: data.entityLabel,
      description: data.description,
      metadata: data.metadata,
      ipAddress: ip,
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;
