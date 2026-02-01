/**
 * ENV VALIDATOR
 * Hard validation before boot
 * System stops if critical values missing
 */

const { logWithTime } = require("@utils/time-stamps.util");
const { 
  AuthModesHelper,
  VerifyModeHelper,
  AuditModeHelper,
  FirstNameFieldSettingHelper,
  DeviceTypeHelper
} = require("@utils/enum-validators.util");

/**
 * Require environment variables
 * System exits if any missing
 */
function requireEnv(keys, context = "Application Boot") {
  const missing = keys.filter(
    (key) => !process.env[key] || process.env[key].trim() === ""
  );

  if (missing.length > 0) {
    logWithTime(`❌ ${context} FAILED`);
    logWithTime(`❌ Missing required ENV variables:`);
    missing.forEach(k => logWithTime(`   - ${k}`));
    process.exit(1); // HARD STOP
  }
}

/**
 * Main validation orchestrator
 */
function validateEnvironment() {

  logWithTime("🔍 Validating Environment Variables...");

  // ===== CORE REQUIREMENTS =====
  requireEnv([
    "DB_URL",
    "ACCESS_TOKEN_SECRET_CODE",
    "REFRESH_TOKEN_SECRET_CODE",
    "SALT"
  ], "Core System");

  // ===== ENUM FIELDS PRESENCE CHECK =====
  requireEnv([
    "AUTH_MODE",
    "VERIFICATION_MODE",
    "AUDIT_MODE",
    "FIRST_NAME_SETTING",
    "DEVICE_TYPE"
  ], "Configuration Enums");

  // ===== AUTH MODE VALIDATION =====
  if (!AuthModesHelper.validate(process.env.AUTH_MODE)) {
    process.exit(1);
  }
  const authMode = process.env.AUTH_MODE;

  // ===== VERIFICATION MODE VALIDATION =====
  if (!VerifyModeHelper.validate(process.env.VERIFICATION_MODE)) {
    process.exit(1);
  }

  // ===== AUDIT MODE VALIDATION =====
  if (!AuditModeHelper.validate(process.env.AUDIT_MODE)) {
    process.exit(1);
  }

  // ===== FIRST NAME SETTING VALIDATION =====
  if (!FirstNameFieldSettingHelper.validate(process.env.FIRST_NAME_SETTING)) {
    process.exit(1);
  }

  // ===== DEVICE TYPE VALIDATION =====
  if (!DeviceTypeHelper.validate(process.env.DEVICE_TYPE)) {
    process.exit(1);
  }

  // ===== AUTH MODE SPECIFIC VALIDATION =====

  // EMAIL Mode
  if (authMode === "EMAIL") {
    requireEnv([
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "EMAIL_FROM"
    ], "AUTH_MODE=EMAIL");
  }

  // PHONE Mode
  else if (authMode === "PHONE") {
    requireEnv([
      "TERMUX_DEVICE_ID",
      "TERMUX_API_KEY"
    ], "AUTH_MODE=PHONE");
  }

  // BOTH Mode
  else if (authMode === "BOTH") {
    requireEnv([
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "EMAIL_FROM",
      "TERMUX_DEVICE_ID",
      "TERMUX_API_KEY"
    ], "AUTH_MODE=BOTH");
  }

  // EITHER Mode
  else if (authMode === "EITHER") {
    // At least one set must be complete
    const hasEmail = process.env.SMTP_HOST && process.env.SMTP_PORT && 
                     process.env.SMTP_USER && process.env.SMTP_PASS && 
                     process.env.EMAIL_FROM;
    
    const hasPhone = process.env.TERMUX_DEVICE_ID && process.env.TERMUX_API_KEY;

    if (!hasEmail && !hasPhone) {
      logWithTime(`❌ AUTH_MODE=EITHER requires at least one complete set:`);
      logWithTime(`   📧 EMAIL: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM`);
      logWithTime(`   📱 PHONE: TERMUX_DEVICE_ID, TERMUX_API_KEY`);
      process.exit(1);
    }

    if (hasEmail) logWithTime("✅ EMAIL credentials found for EITHER mode");
    if (hasPhone) logWithTime("✅ PHONE credentials found for EITHER mode");
  }

  // ===== MICROSERVICE MODE VALIDATION =====
  if (process.env.MAKE_IT_MICROSERVICE === "true") {
    requireEnv([
      "SERVICE_TOKEN_SECRET",
      "SERVICE_INSTANCE_NAME",
      "REDIS_KEY_SALT",
      "ADMIN_PANEL_SERVICE_URL"
    ], "MAKE_IT_MICROSERVICE=true");
  }

  // ===== VERIFICATION LINK SECRET =====
  if (process.env.VERIFICATION_MODE === "LINK") {
    requireEnv(["VERIFICATION_LINK_SECRET"], "VERIFICATION_MODE=LINK");
  }

  logWithTime("✅ Environment Validation Completed");
}

module.exports = { 
  validateEnvironment,
  requireEnv
};
