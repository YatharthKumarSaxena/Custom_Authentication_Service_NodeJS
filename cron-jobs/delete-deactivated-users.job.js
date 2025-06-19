const cron = require("node-cron");
const UserModel = require("../models/user.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { userCleanup } = require("../configs/cron.config");

const deleteDeactivatedUsers = async () => {
  try {
    const cutoffDate = new Date(Date.now() - userCleanup.deactivatedRetentionDays * 24 * 60 * 60 * 1000);
    const result = await UserModel.deleteMany({
      isActive: false,
      lastDeactivatedAt: { $lt: cutoffDate },
      userType: "Customer"
    });

    logWithTime(`🗑️ Account Deletion Job: ${result.deletedCount} users hard deleted (inactive > ${userCleanup.deactivatedRetentionDays} days).`);
  } catch (err) {
    logWithTime("❌ Error in deleting old deactivated users.");
    console.error(err);
  }
};

// ⏰ Run on schedule
cron.schedule(userCleanup.cronSchedule, deleteDeactivatedUsers, {
  timezone: userCleanup.timezone
});
