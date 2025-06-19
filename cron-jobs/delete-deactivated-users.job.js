const cron = require("node-cron");
const UserModel = require("../models/user.model");
const { logWithTime } = require("../utils/time-stamps.utils");

const deleteDeactivatedUsers = async () => {
  try {
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days
    const result = await UserModel.deleteMany({
      isActive: false,
      lastDeactivatedAt: { $lt: cutoffDate },
      userType: "Customer" // 🛡️ Only customer accounts
    });

    logWithTime(`🗑️ Account Deletion Job: ${result.deletedCount} users hard deleted (inactive for 60+ days).`);
  } catch (err) {
    logWithTime("❌ Error in deleting old deactivated users.");
    console.error(err);
  }
};

// Run every Sunday at 3:00 AM
cron.schedule("0 3 * * 0", deleteDeactivatedUsers, {
  timezone: "Asia/Kolkata"
});
