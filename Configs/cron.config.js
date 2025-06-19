// 📅 configs/cron.config.js

module.exports = {
  signUpAttemptCleanup: {
    cronSchedule: "0 2 * * 0",         // ⏰ Sunday 2 AM
    timezone: "Asia/Kolkata",
    retentionDays: 60
  },
  userCleanup: {
    cronSchedule: "0 3 * * 0",         // ⏰ Sunday 3 AM
    timezone: "Asia/Kolkata",
    deactivatedRetentionDays: 60
  }
};
