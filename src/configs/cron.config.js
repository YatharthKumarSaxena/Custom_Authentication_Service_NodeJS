// configs/cron.config.js

const { getMyEnv, getMyEnvAsNumber } = require("@/utils/env.util");

module.exports = {
  userCleanup: {
    enable: true,
    cronSchedule: getMyEnv("USER_CLEANUP_CRON", "0 3 * * 0"),
    timezone: getMyEnv("USER_CLEANUP_TIMEZONE", "Asia/Kolkata"),
    deactivatedRetentionDays: getMyEnvAsNumber("USER_RETENTION_DAYS", 60)
  },
  authLogCleanup: {
    enable: true,
    cronSchedule: getMyEnv("AUTH_LOG_CLEANUP_CRON", "0 5 * * 0"),           // Default: Sunday 5 AM
    timezone: getMyEnv("AUTH_LOG_CLEANUP_TIMEZONE", "Asia/Kolkata"),
    deactivatedRetentionDays: getMyEnvAsNumber("AUTH_LOG_RETENTION_DAYS", 90)
  },
  sessionCleanup: {
    enable: true,
    cronSchedule: getMyEnv("SESSION_CLEANUP_CRON", "0 2 * * *"),           // Default: Daily 2 AM
    timezone: getMyEnv("SESSION_CLEANUP_TIMEZONE", "Asia/Kolkata")
  },
  verificationCleanup: {
    enable: true,
    cronSchedule: getMyEnv("VERIFICATION_CLEANUP_CRON", "0 4 * * *"),      // Default: Daily 4 AM
    timezone: getMyEnv("VERIFICATION_CLEANUP_TIMEZONE", "Asia/Kolkata")
  },
  deviceCleanup: {
    enable: false,                                                             // Disabled by default
    cronSchedule: getMyEnv("DEVICE_CLEANUP_CRON", "0 6 * * 0"),            // Default: Sunday 6 AM
    timezone: getMyEnv("DEVICE_CLEANUP_TIMEZONE", "Asia/Kolkata"),
    inactiveDays: getMyEnvAsNumber("DEVICE_INACTIVE_DAYS", 180)            // 6 months
  }
};
