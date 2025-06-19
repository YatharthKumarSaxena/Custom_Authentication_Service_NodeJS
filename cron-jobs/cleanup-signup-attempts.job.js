const cron = require("node-cron");
const SignUpAttempt = require("../models/signUpAttempt.model");
const { logWithTime } = require("../Utils/timeStamps.utils");

const cleanOldSignUpAttempts = async () => {
  try {
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days
    const result = await SignUpAttempt.deleteMany({ lastAttemptAt: { $lt: cutoffDate } });

    logWithTime(`🧹 SignUpAttempt Cleanup: ${result.deletedCount} records older than 60 days were deleted.`);
  } catch (err) {
    logWithTime("❌ Error in cleaning old sign-up attempts.");
    console.error(err);
  }
};

// Run every Sunday at 2:00 AM
cron.schedule("0 2 * * 0", cleanOldSignUpAttempts, {
  timezone: "Asia/Kolkata"
});
