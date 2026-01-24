const cron = require("node-cron");
const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { sessionCleanup } = require("@configs/cron.config");
const { errorMessage } = require("@utils/error-handler.util");
const { logCronExecution, logCronFailure } = require("@/services/system/system-log.util");

const cleanExpiredSessions = async () => {
  try {
    if (!sessionCleanup.enable) return;

    logWithTime("📅 [CRON-JOB] ➤ Expired Sessions Cleanup Started...");

    const result = await UserDeviceModel.deleteMany({
      refreshTokenExpiresAt: { $lt: new Date() }
    });

    if (result.deletedCount === 0) {
      logWithTime(`📭 No expired sessions found.`);
    } else {
      logWithTime(`🗑️ Session Cleanup Job: ${result.deletedCount} expired sessions deleted.`);
    }
    
    // System Log (fire-and-forget)
    logCronExecution(
      "CLEANUP_EXPIRED_SESSIONS",
      { deletedCount: result.deletedCount },
      `Deleted ${result.deletedCount} expired refresh token sessions`
    );
  } catch (err) {
    logWithTime("❌ Internal Error in cleaning expired sessions.");
    errorMessage(err);
    logCronFailure("CLEANUP_EXPIRED_SESSIONS", err);
  }
};

// ⏰ Run on schedule
cron.schedule(sessionCleanup.cronSchedule, cleanExpiredSessions, {
  timezone: sessionCleanup.timezone
});
