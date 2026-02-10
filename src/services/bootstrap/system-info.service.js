// src/services/bootstrap/system-info.service.js
// Bootstrap System Configuration Logger
// Logs comprehensive system properties at startup for debugging, compliance, and operational visibility

const { logWithTime } = require("@utils/time-stamps.util");
const securityConfig = require("@configs/security.config");
const rateLimitConfig = require("@configs/rate-limit.config");

// ==================== HELPER FUNCTIONS ====================

/**
 * Masks sensitive values showing only first 3 and last 2 characters
 * @param {string} value - Secret to mask
 * @returns {string} Masked value (e.g., "abc...xy")
 */
function maskSecret(value) {
  if (!value || value.length < 6) return "***";
  const firstPart = value.substring(0, 3);
  const lastPart = value.substring(value.length - 2);
  return `${firstPart}...${lastPart}`;
}

/**
 * Extracts database name from MongoDB connection string
 * @param {string} dbUrl - MongoDB connection URL
 * @returns {string} Database name with credentials masked
 */
function extractDbInfo(dbUrl) {
  try {
    const url = new URL(dbUrl);
    const dbName = url.pathname.split("/")[1]?.split("?")[0] || "unknown";
    const hasCredentials = url.username || url.password;
    const host = url.hostname;
    const port = url.port || "27017";
    
    return {
      name: dbName,
      host: hasCredentials ? `${maskSecret(url.username)}@${host}` : host,
      port: port
    };
  } catch (err) {
    return { name: "unknown", host: "unknown", port: "unknown" };
  }
}

/**
 * Converts seconds to human-readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Human-readable time (e.g., "15m", "7d", "1h 30m")
 */
function formatExpiry(seconds) {
  if (!seconds || isNaN(seconds)) return "Not set";
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Gets rate limiter count for display
 * @param {object} rateLimitConfig - Rate limit configuration object
 * @returns {number} Total number of rate limiters
 */
function getRateLimiterCount(config) {
  const perDevice = Object.keys(config.perDevice || {}).length;
  const perUserDevice = Object.keys(config.perUserAndDevice || {}).length;
  return perDevice + perUserDevice;
}

/**
 * Checks if a value represents "enabled" status
 * @param {any} value - Value to check
 * @returns {string} "✅ Enabled" or "❌ Disabled"
 */
function getEnabledStatus(value) {
  const truthyValues = ["true", "1", "yes", "enabled", true, 1];
  const normalizedValue = String(value).toLowerCase().trim();
  return truthyValues.includes(normalizedValue) || value === true 
    ? "✅ Enabled" 
    : "❌ Disabled";
}

/**
 * Safely gets environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not set
 * @returns {string} Environment variable value or default
 */
function getEnvSafe(key, defaultValue = "Not set") {
  const value = process.env[key];
  return value !== undefined && value !== "" ? value : defaultValue;
}

// ==================== SECTION LOGGERS ====================

/**
 * Section 1: Environment & Runtime Information
 */
function logEnvironmentInfo() {
  const dbInfo = extractDbInfo(process.env.DB_URL || "");
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("🌐 ENVIRONMENT & RUNTIME");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Node Version:       ${process.version}`);
  console.log(`   Environment:        ${process.env.NODE_ENV || "development"}`);
  console.log(`   Server Port:        ${process.env.PORT_NUMBER || 8080}`);
  console.log(`   Database Name:      ${dbInfo.name}`);
  console.log(`   Database Host:      ${dbInfo.host}:${dbInfo.port}`);
  console.log(`   Platform:           ${process.platform} (${process.arch})`);
  console.log(`   Process ID:         ${process.pid}`);
  console.log(`   Working Directory:  ${process.cwd()}`);
}

/**
 * Section 2: Authentication Configuration
 */
function logAuthenticationConfig() {
  const authMode = getEnvSafe("AUTH_MODE", "EMAIL");
  const verificationMode = getEnvSafe("VERIFICATION_MODE", "OTP");
  const autoLogin = getEnvSafe("AUTO_LOGIN_AFTER_VERIFICATION", "false");
  const autoEmailVerify = getEnvSafe("AUTO_EMAIL_VERIFICATION", "false");
  const autoPhoneVerify = getEnvSafe("AUTO_PHONE_VERIFICATION", "false");
  const firstNameSetting = getEnvSafe("FIRST_NAME_SETTING", "Optional");
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("🔐 AUTHENTICATION CONFIGURATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Auth Mode:                ${authMode}`);
  console.log(`   Verification Mode:        ${verificationMode}`);
  console.log(`   Auto Login After Verify:  ${getEnabledStatus(autoLogin)}`);
  console.log(`   Auto Email Verification:  ${getEnabledStatus(autoEmailVerify)}`);
  console.log(`   Auto Phone Verification:  ${getEnabledStatus(autoPhoneVerify)}`);
  console.log(`   First Name Setting:       ${firstNameSetting}`);
  
  // OTP Configuration
  console.log(`\n   OTP Configuration:`);
  console.log(`      Length:                ${securityConfig.otp.length} digits`);
  console.log(`      Max Attempts:          ${securityConfig.otp.maxAttempts}`);
  
  // Verification Expiry Times
  const verificationSecurity = securityConfig.verificationSecurity;
  if (verificationSecurity) {
    console.log(`\n   Verification Expiry Settings:`);
    Object.keys(verificationSecurity).forEach(purpose => {
      const config = verificationSecurity[purpose];
      console.log(`      ${purpose}:`);
      if (verificationMode === "OTP" || verificationMode === "BOTH") {
        console.log(`         OTP:  ${config.OTP_EXPIRY_MINUTES}m (${config.MAX_ATTEMPTS} attempts)`);
      }
      if (verificationMode === "LINK" || verificationMode === "BOTH") {
        console.log(`         Link: ${config.LINK_EXPIRY_MINUTES}m`);
      }
    });
  }
}

/**
 * Section 3: Security Features & Policies
 */
function logSecurityFeatures() {
  const is2FAEnabled = getEnvSafe("IS_2FA_FEATURE_ENABLED", "false");
  const deviceSoftReplace = getEnvSafe("ENABLE_DEVICE_SOFT_REPLACE", "false");
  const whitelistedDevices = getEnvSafe("WHITELISTED_DEVICE_UUIDS", "");
  const whitelistedCount = whitelistedDevices ? whitelistedDevices.split(",").filter(d => d.trim()).length : 0;
  const userCapacity = getEnvSafe("USER_REGISTRATION_CAPACITY", "Unlimited");
  
  // Token Expiry
  const accessExpiry = formatExpiry(parseInt(process.env.ACCESS_TOKEN_EXPIRY || 900));
  const refreshExpiry = formatExpiry(parseInt(process.env.REFRESH_TOKEN_EXPIRY || 604800));
  const resetExpiry = formatExpiry(parseInt(process.env.RESET_TOKEN_EXPIRY || 3600));
  const verifyExpiry = formatExpiry(parseInt(process.env.VERIFICATION_TOKEN_EXPIRY || 900));
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("🛡️ SECURITY FEATURES & POLICIES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Two-Factor Auth (2FA):    ${getEnabledStatus(is2FAEnabled)}`);
  console.log(`   Device Soft Replace:      ${getEnabledStatus(deviceSoftReplace)}`);
  console.log(`   Whitelisted Devices:      ${whitelistedCount} device(s)`);
  console.log(`   User Registration Cap:    ${userCapacity}`);
  
  console.log(`\n   Password Security:`);
  console.log(`      Max Failed Attempts:   ${securityConfig.passwordSecurity.MAX_ATTEMPTS}`);
  console.log(`      Account Lockout Time:  ${securityConfig.passwordSecurity.LOCKOUT_TIME_MINUTES} minutes`);
  console.log(`      Bcrypt Salt Rounds:    ${securityConfig.SALT}`);
  
  console.log(`\n   Device Policies:`);
  console.log(`      Admin Devices Allowed:    ${securityConfig.deviceThreshold.ADMIN}`);
  console.log(`      Customer Devices Allowed: ${securityConfig.deviceThreshold.CUSTOMER}`);
  console.log(`      Users Per Device:         ${securityConfig.usersPerDevice}`);
  
  console.log(`\n   Token Expiry Times:`);
  console.log(`      Access Token:         ${accessExpiry}`);
  console.log(`      Refresh Token:        ${refreshExpiry}`);
  console.log(`      Reset Token:          ${resetExpiry}`);
  console.log(`      Verification Token:   ${verifyExpiry}`);
  
  console.log(`\n   Cookie Security:`);
  console.log(`      HTTP Only:            ${getEnabledStatus(process.env.COOKIE_HTTP_ONLY || "true")}`);
  console.log(`      Secure (HTTPS):       ${getEnabledStatus(process.env.COOKIE_SECURE || "false")}`);
  console.log(`      Same Site:            ${getEnvSafe("COOKIE_SAME_SITE", "Strict")}`);
  console.log(`      Domain:               ${getEnvSafe("COOKIE_DOMAIN", "Not set")}`);
}

/**
 * Section 4: Rate Limiting Configuration
 */
function logRateLimitConfig() {
  const globalWindow = getEnvSafe("RATE_LIMIT_WINDOW", "10");
  const globalMax = getEnvSafe("RATE_LIMIT_MAX", "100");
  const limiterCount = getRateLimiterCount(rateLimitConfig);
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("⏱️ RATE LIMITING CONFIGURATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   Global Rate Limit:`);
  console.log(`      Window:               ${globalWindow} minutes`);
  console.log(`      Max Requests:         ${globalMax} per IP`);
  console.log(`      Storage:              Redis-backed (distributed)`);
  
  console.log(`\n   Per-Endpoint Rate Limiters:`);
  console.log(`      Total Endpoints:      ${limiterCount}`);
  console.log(`      Per Device:           ${Object.keys(rateLimitConfig.perDevice || {}).length} endpoint(s)`);
  console.log(`      Per User+Device:      ${Object.keys(rateLimitConfig.perUserAndDevice || {}).length} endpoint(s)`);
  
  // Show a few examples
  if (rateLimitConfig.perDevice) {
    console.log(`\n   Sample Per-Device Limits:`);
    const samples = ["signin", "signup", "forgotPassword"];
    samples.forEach(key => {
      const config = rateLimitConfig.perDevice[key];
      if (config) {
        const windowMin = Math.floor(config.windowMs / 60000);
        console.log(`      ${key.padEnd(18)}: ${config.maxRequests} requests / ${windowMin}m`);
      }
    });
  }
}

/**
 * Section 5: External Integrations
 */
function logExternalIntegrations() {
  // Email Configuration
  const smtpHost = getEnvSafe("SMTP_HOST", "Not configured");
  const smtpPort = getEnvSafe("SMTP_PORT", "N/A");
  const smtpUser = getEnvSafe("SMTP_USER", "Not configured");
  const smtpConfigured = smtpHost !== "Not configured" && smtpUser !== "Not configured";
  const emailFrom = getEnvSafe("EMAIL_FROM", "Not set");
  const emailFromName = getEnvSafe("EMAIL_FROM_NAME", "Authentication Service");
  
  // SMS Configuration
  const smsMode = getEnvSafe("SMS_MODE", "disabled");
  const smsEnabled = getEnvSafe("SMS_ENABLED", "false");
  const termuxIP = process.env.TERMUX_IP;
  const termuxConfigured = termuxIP && termuxIP !== "";
  
  // Redis Configuration
  const redisHost = getEnvSafe("REDIS_HOST", "127.0.0.1");
  const redisPort = getEnvSafe("REDIS_PORT", "6379");
  const redisDB = getEnvSafe("REDIS_DB", "0");
  const redisMaxRetries = getEnvSafe("REDIS_MAX_RETRY_ATTEMPTS", "10");
  const redisInitialDelay = getEnvSafe("REDIS_RETRY_INITIAL_DELAY", "100");
  const redisMaxDelay = getEnvSafe("REDIS_RETRY_MAX_DELAY", "2000");
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("🔌 EXTERNAL INTEGRATIONS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log(`   Email (SMTP):`);
  console.log(`      Status:               ${smtpConfigured ? "✅ Configured" : "❌ Not configured"}`);
  if (smtpConfigured) {
    console.log(`      Host:                 ${smtpHost}`);
    console.log(`      Port:                 ${smtpPort}`);
    console.log(`      User:                 ${maskSecret(smtpUser)}`);
    console.log(`      From Address:         ${emailFrom}`);
    console.log(`      From Name:            ${emailFromName}`);
  }
  
  console.log(`\n   SMS Service:`);
  console.log(`      Status:               ${getEnabledStatus(smsEnabled)}`);
  console.log(`      Mode:                 ${smsMode}`);
  if (smsMode === "termux-ssh" || smsMode === "termux") {
    console.log(`      Termux Bridge:        ${termuxConfigured ? "✅ Configured" : "❌ Not configured"}`);
    if (termuxConfigured) {
      console.log(`      Termux IP:            ${redisHost === termuxIP ? termuxIP : maskSecret(termuxIP)}`);
      console.log(`      Termux Port:          ${getEnvSafe("TERMUX_PORT", "8022")}`);
    }
  }
  
  console.log(`\n   Redis Cache:`);
  console.log(`      Host:                 ${redisHost}`);
  console.log(`      Port:                 ${redisPort}`);
  console.log(`      Database:             ${redisDB}`);
  console.log(`      Retry Configuration:`);
  console.log(`         Max Attempts:      ${redisMaxRetries}`);
  console.log(`         Initial Delay:     ${redisInitialDelay}ms`);
  console.log(`         Max Delay:         ${redisMaxDelay}ms`);
}

/**
 * Section 6: Microservice Configuration
 */
function logMicroserviceConfig() {
  const isMicroservice = getEnvSafe("MAKE_IT_MICROSERVICE", "false");
  const isEnabled = isMicroservice.toLowerCase() === "true";
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("🔧 MICROSERVICE CONFIGURATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  if (isEnabled) {
    const instanceName = getEnvSafe("SERVICE_INSTANCE_NAME", "auth-service-01");
    const adminPanelUrl = getEnvSafe("ADMIN_PANEL_SERVICE_URL", "Not set");
    const softwareManagementUrl = getEnvSafe("SOFTWARE_MANAGEMENT_SERVICE_URL", "Not set");
    
    console.log(`   Mode:                     ✅ MICROSERVICE MODE`);
    console.log(`   Service Instance:         ${instanceName}`);
    console.log(`   Admin Panel Service:      ${adminPanelUrl}`);
    console.log(`   Software Mgmt Service:    ${softwareManagementUrl}`);
    console.log(`   Service Token:            ${maskSecret(process.env.SERVICE_TOKEN_SECRET || "")}`);
    console.log(`   Redis Key Salt:           ${maskSecret(process.env.REDIS_KEY_SALT || "")}`);
    console.log(`\n   Features:`);
    console.log(`      ✅ Redis Session Management`);
    console.log(`      ✅ Service-to-Service Auth`);
    console.log(`      ✅ Token Rotation Scheduler`);
    console.log(`      ✅ Internal API Routes`);
  } else {
    console.log(`   Mode:                     🏢 MONOLITHIC MODE`);
    console.log(`\n   Features:`);
    console.log(`      ❌ No Redis Session Management`);
    console.log(`      ❌ No Service-to-Service Auth`);
    console.log(`      ❌ No Token Rotation`);
    console.log(`      ❌ Internal Routes Disabled`);
  }
}

/**
 * Section 7: Operational Settings
 */
function logOperationalSettings() {
  const auditMode = getEnvSafe("AUDIT_MODE", "CHANGED_ONLY");
  const authLogging = getEnvSafe("ENABLE_AUTH_SESSION_LOGGING", "false");
  const userRetention = getEnvSafe("USER_RETENTION_DAYS", "Not set");
  const authLogRetention = getEnvSafe("AUTH_LOG_RETENTION_DAYS", "Not set");
  const deviceInactive = getEnvSafe("DEVICE_INACTIVE_DAYS", "Not set");
  const cronTimezone = getEnvSafe("CRON_TIMEZONE", "UTC") || getEnvSafe("USER_CLEANUP_TIMEZONE", "UTC");
  
  const frontendUrl = getEnvSafe("FRONTEND_URL", "Not set");
  const adminPanelLink = getEnvSafe("ADMIN_PANEL_LINK", "Not set");
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("⚙️ OPERATIONAL SETTINGS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log(`   Audit Configuration:`);
  console.log(`      Audit Mode:           ${auditMode}`);
  console.log(`      Auth Session Logging: ${getEnabledStatus(authLogging)}`);
  
  console.log(`\n   Data Retention Policies:`);
  console.log(`      Users (Deactivated):  ${userRetention} days`);
  console.log(`      Auth Logs:            ${authLogRetention} days`);
  console.log(`      Inactive Devices:     ${deviceInactive} days`);
  
  console.log(`\n   Application URLs:`);
  console.log(`      Frontend URL:         ${frontendUrl}`);
  console.log(`      Admin Panel Link:     ${adminPanelLink}`);
  
  console.log(`\n   Cron Job Settings:`);
  console.log(`      Timezone:             ${cronTimezone}`);
  
  // Branding
  const companyName = getEnvSafe("COMPANY_NAME", "Not set");
  const supportEmail = getEnvSafe("SUPPORT_EMAIL", "Not set");
  const companyAddress = getEnvSafe("COMPANY_ADDRESS", "Not set");
  
  console.log(`\n   Branding & Support:`);
  console.log(`      Company Name:         ${companyName}`);
  console.log(`      Support Email:        ${supportEmail}`);
  console.log(`      Company Address:      ${companyAddress}`);
}

/**
 * Section 8: Scheduled Jobs (Cron)
 */
function logScheduledJobs() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logWithTime("⏰ SCHEDULED JOBS (CRON)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const cronJobs = [
    {
      name: "Delete Deactivated Users",
      enabledKey: "USER_CLEANUP_ENABLED",
      scheduleKey: "USER_CLEANUP_CRON",
      defaultSchedule: "0 3 * * 0",
      description: "Weekly cleanup of deactivated user accounts"
    },
    {
      name: "Cleanup Auth Logs",
      enabledKey: "AUTH_LOG_CLEANUP_ENABLED",
      scheduleKey: "AUTH_LOG_CLEANUP_CRON",
      defaultSchedule: "0 5 * * 0",
      description: "Weekly cleanup of old authentication logs"
    },
    {
      name: "Cleanup Expired Sessions",
      enabledKey: "SESSION_CLEANUP_ENABLED",
      scheduleKey: "SESSION_CLEANUP_CRON",
      defaultSchedule: "0 2 * * *",
      description: "Daily cleanup of expired user sessions"
    },
    {
      name: "Cleanup Used Verifications",
      enabledKey: "VERIFICATION_CLEANUP_ENABLED",
      scheduleKey: "VERIFICATION_CLEANUP_CRON",
      defaultSchedule: "0 4 * * *",
      description: "Daily cleanup of used verification tokens"
    },
    {
      name: "Cleanup Inactive Devices",
      enabledKey: "DEVICE_CLEANUP_ENABLED",
      scheduleKey: "DEVICE_CLEANUP_CRON",
      defaultSchedule: "0 6 * * 0",
      description: "Weekly cleanup of inactive devices"
    }
  ];
  
  cronJobs.forEach((job, index) => {
    const enabled = getEnvSafe(job.enabledKey, "true");
    const schedule = getEnvSafe(job.scheduleKey, job.defaultSchedule);
    const status = getEnabledStatus(enabled);
    
    console.log(`\n   ${index + 1}. ${job.name}`);
    console.log(`      Status:               ${status}`);
    console.log(`      Schedule:             ${schedule}`);
    console.log(`      Description:          ${job.description}`);
  });
}

// ==================== MAIN EXPORT ====================

/**
 * Logs comprehensive system configuration at bootstrap
 * Non-blocking, logs to console for observability
 * Masks all secrets for security
 */
async function logSystemConfiguration() {
  try {
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════════════════");
    logWithTime("📋 SYSTEM CONFIGURATION REPORT");
    console.log("═══════════════════════════════════════════════════════════════════════");
    
    logEnvironmentInfo();
    logAuthenticationConfig();
    logSecurityFeatures();
    logRateLimitConfig();
    logExternalIntegrations();
    logMicroserviceConfig();
    logOperationalSettings();
    logScheduledJobs();
    
    console.log("\n═══════════════════════════════════════════════════════════════════════");
    logWithTime("✅ SYSTEM CONFIGURATION REPORT COMPLETE");
    console.log("═══════════════════════════════════════════════════════════════════════\n");
    
    return true;
  } catch (err) {
    console.error("⚠️ Failed to log system configuration:", err.message);
    return false;
  }
}

module.exports = {
  logSystemConfiguration
};
