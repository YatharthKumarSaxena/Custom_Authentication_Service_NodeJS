// 📅 configs/cron.config.js

module.exports = {
  userCleanup: {
    enable: true,
    cronSchedule: process.env.USER_CLEANUP_CRON || "0 3 * * 0",               // ⏰ Default: Sunday 3 AM
    timezone: process.env.USER_CLEANUP_TIMEZONE || "Asia/Kolkata",
    deactivatedRetentionDays: Number(process.env.USER_RETENTION_DAYS) || 60
  },
  authLogCleanup: {
    enable: true,
    cronSchedule: process.env.AUTH_LOG_CLEANUP_CRON || "0 5 * * 0",           // ⏰ Default: Sunday 5 AM
    timezone: process.env.AUTH_LOG_CLEANUP_TIMEZONE || "Asia/Kolkata",
    deactivatedRetentionDays: Number(process.env.AUTH_LOG_RETENTION_DAYS) || 90
  },
  sessionCleanup: {
    enable: true,
    cronSchedule: process.env.SESSION_CLEANUP_CRON || "0 2 * * *",           // ⏰ Default: Daily 2 AM
    timezone: process.env.SESSION_CLEANUP_TIMEZONE || "Asia/Kolkata"
  },
  verificationCleanup: {
    enable: true,
    cronSchedule: process.env.VERIFICATION_CLEANUP_CRON || "0 4 * * *",      // ⏰ Default: Daily 4 AM
    timezone: process.env.VERIFICATION_CLEANUP_TIMEZONE || "Asia/Kolkata"
  },
  deviceCleanup: {
    enable: false,                                                             // ⚠️ Disabled by default
    cronSchedule: process.env.DEVICE_CLEANUP_CRON || "0 6 * * 0",            // ⏰ Default: Sunday 6 AM
    timezone: process.env.DEVICE_CLEANUP_TIMEZONE || "Asia/Kolkata",
    inactiveDays: Number(process.env.DEVICE_INACTIVE_DAYS) || 180            // 6 months
  }
};
