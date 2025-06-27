const cron = require("node-cron");
const UserModel = require("../models/user.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { userCleanup } = require("../configs/cron.config");
const { errorMessage } = require("../configs/error-handler.configs");

const deleteDeactivatedUsers = async () => {
  try {
    if(!userCleanup.enable)return;
    if (!userCleanup.deactivatedRetentionDays || userCleanup.deactivatedRetentionDays < 1) {
      logWithTime("⚠️ Invalid retention days configuration. Skipping user cleanup.");
      return;
    }
    const cutoffDate = new Date(Date.now() - userCleanup.deactivatedRetentionDays * 24 * 60 * 60 * 1000);
    logWithTime("📅 [CRON-JOB] ➤ Deactivated Users Cleanup Started...");
    const result = await UserModel.deleteMany({
      isActive: false,
      lastDeactivatedAt: { $lt: cutoffDate },
      userType: "CUSTOMER"
    });
    if(result.deletedCount === 0){
      logWithTime(`📭 No users eligible for deletion (deactivated more than ${userCleanup.deactivatedRetentionDays} days).`);
    }else {
      logWithTime(`🗑️ Account Deletion Job: ${result.deletedCount} users hard deleted (inactive > ${userCleanup.deactivatedRetentionDays} days).`);
    }
  } catch (err) {
    logWithTime("❌ Internal Error in deleting old deactivated users.");
    errorMessage(err);
  }
};

// ⏰ Run on schedule
cron.schedule(userCleanup.cronSchedule, deleteDeactivatedUsers, {
  timezone: userCleanup.timezone
});
