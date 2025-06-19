// 📅 configs/cron.config.js

module.exports = {
  userCleanup: {
    cronSchedule: "0 3 * * 0",         // ⏰ Sunday 3 AM
    timezone: "Asia/Kolkata",
    deactivatedRetentionDays: 60
  }
};
