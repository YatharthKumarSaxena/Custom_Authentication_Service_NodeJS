const cron = require("node-cron");
const AuthLogModel = require("../models/auth-logs.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { authLogCleanup } = require("../configs/cron.config");

const cleanAuthLogs = async () => {
  try {
    if(!authLogCleanup.enable)return;
    if (!authLogCleanup.deactivatedRetentionDays || authLogCleanup.deactivatedRetentionDays < 1) {
      logWithTime("⚠️ Invalid retention days configuration. Skipping auth log cleanup.");
      return;
    }
    const cutoffDate = new Date(Date.now() - authLogCleanup.deactivatedRetentionDays * 24 * 60 * 60 * 1000);
    const result = await AuthLogModel.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    logWithTime(`🗑️ Auth Logs Deletion Job: ${result.deletedCount} auth logs hard deleted (created > ${authLogCleanup.deactivatedRetentionDays} days).`);
  } catch (err) {
    logWithTime("❌ Error in deleting old auth logs.");
    console.error(err);
  }
};

// ⏰ Run on schedule
cron.schedule(authLogCleanup.cronSchedule, cleanAuthLogs, {
  timezone: authLogCleanup.timezone
});
