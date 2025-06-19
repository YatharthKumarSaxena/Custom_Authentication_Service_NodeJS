const cron = require("node-cron");
const SignUpAttempt = require("../models/signUpAttempt.model");
const { logWithTime } = require("../utils/timeStamps.utils");
const { signUpAttemptCleanup } = require("../configs/cron.config");

const cleanOldSignUpAttempts = async () => {
  try {
    const cutoffDate = new Date(Date.now() - signUpAttemptCleanup.retentionDays * 24 * 60 * 60 * 1000);
    const result = await SignUpAttempt.deleteMany({ lastAttemptAt: { $lt: cutoffDate } });

    logWithTime(`🧹 SignUpAttempt Cleanup: ${result.deletedCount} records older than ${signUpAttemptCleanup.retentionDays} days were deleted.`);
  } catch (err) {
    logWithTime("❌ Error in cleaning old sign-up attempts.");
    console.error(err);
  }
};

// 🕑 Schedule job
cron.schedule(signUpAttemptCleanup.cronSchedule, cleanOldSignUpAttempts, {
  timezone: signUpAttemptCleanup.timezone
});
