const cron = require("node-cron");
const AuthLogModel = require("../models/auth-logs.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { authLogCleanup } = require("../configs/cron.config");
const { errorMessage} = require("../configs/error-handler.configs");

const cleanAuthLogs = async () => {
  try {
    if(!authLogCleanup.enable)return;
    if (!authLogCleanup.deactivatedRetentionDays || authLogCleanup.deactivatedRetentionDays < 1) {
      logWithTime("⚠️ Invalid retention days configuration. Skipping auth log cleanup.");
      return;
    }
    const cutoffDate = new Date(Date.now() - authLogCleanup.deactivatedRetentionDays * 24 * 60 * 60 * 1000);
    logWithTime("📅 [CRON-JOB] ➤ Auth Logs Cleanup Started...");
    const result = await AuthLogModel.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    await logAuthEvent({
      user: { userID: "SYSTEM_BATCH_CRON", userType: "SYSTEM" },
      deviceID: process.env.DEVICE_UUID,
      deviceName: process.env.DEVICE_NAME,
      deviceType: process.env.DEVICE_TYPE
    }, "CLEAN_UP_AUTH_LOGS", {
    reason: `Deleted ${result.deletedCount} auth logs (> ${userCleanup.deactivatedRetentionDays} days)`
    });
    if(result.deletedCount === 0){
      logWithTime(`📭 No auth logs eligible for deletion (older than ${authLogCleanup.deactivatedRetentionDays} days).`);
    }else {
      logWithTime(`🗑️ Auth Logs Deletion Job: ${result.deletedCount} auth logs hard deleted (created > ${authLogCleanup.deactivatedRetentionDays} days).`);
    }
  } catch (err) {
    logWithTime("❌ Internal Error in deleting old auth logs by Cron Job.");
    errorMessage(err);
    return;
  }
};

// ⏰ Run on schedule
cron.schedule(authLogCleanup.cronSchedule, cleanAuthLogs, {
  timezone: authLogCleanup.timezone
});
