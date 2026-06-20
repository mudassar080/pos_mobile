const ActivityLog = require('../models/ActivityLog');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { getRetentionCutoff } = require('../utils/cleanupActivityLogs');

// @desc    List activity logs
// @route   GET /api/activity-logs
// @access  Admin / Superadmin
const getActivityLogs = async (req, res) => {
  try {
    const paging = parsePagination(req, res);
    if (!paging) return;

    const { page, limit, skip } = paging;
    const {
      search,
      entity,
      action,
      userId,
      startDate,
      endDate,
    } = req.query;

    const query = {};
    const retentionCutoff = getRetentionCutoff();

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { entityLabel: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (userId) query.user = userId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(Math.max(new Date(startDate), retentionCutoff));
      } else {
        query.createdAt.$gte = retentionCutoff;
      }
      if (endDate) query.createdAt.$lte = new Date(endDate);
    } else {
      query.createdAt = { $gte: retentionCutoff };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ActivityLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message,
    });
  }
};

module.exports = {
  getActivityLogs,
};
