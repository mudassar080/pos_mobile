const ActivityLog = require('../models/ActivityLog');

const RETENTION_DAYS = 2;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function getRetentionCutoff() {
  return new Date(Date.now() - RETENTION_MS);
}

async function cleanupActivityLogs() {
  const cutoff = getRetentionCutoff();
  const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoff } });

  if (result.deletedCount > 0) {
    console.log(
      `Removed ${result.deletedCount} activity log(s) older than ${RETENTION_DAYS} days`
    );
  }

  return result.deletedCount;
}

function scheduleDailyActivityLogCleanup() {
  const run = () => {
    cleanupActivityLogs().catch((error) => {
      console.error('Activity log cleanup failed:', error.message);
    });
  };

  run();
  setInterval(run, CLEANUP_INTERVAL_MS);
}

module.exports = {
  RETENTION_DAYS,
  RETENTION_MS,
  CLEANUP_INTERVAL_MS,
  getRetentionCutoff,
  cleanupActivityLogs,
  scheduleDailyActivityLogCleanup,
};
