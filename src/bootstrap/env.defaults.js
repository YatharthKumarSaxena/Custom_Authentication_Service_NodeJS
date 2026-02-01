/**
 * ENV DEFAULTS
 * Safe default values for non-critical configuration
 * NO SECRETS, NO AUTH MODES, NO VERIFICATION MODES
 */

function applyEnvDefaults() {

  // Server Configuration
  process.env.NODE_ENV ||= "development";
  process.env.PORT_NUMBER ||= "8080";

  // Cookie Security
  process.env.COOKIE_HTTP_ONLY ||= "true";
  process.env.COOKIE_SECURE ||= "false";
  process.env.COOKIE_SAME_SITE ||= "Strict";

  // Audit Mode
  process.env.AUDIT_MODE ||= "CHANGED_ONLY";

  // Microservice
  process.env.MAKE_IT_MICROSERVICE ||= "false";

  // Feature Flags
  process.env.AUTO_LOGIN_AFTER_VERIFICATION ||= "false";
  process.env.AUTO_EMAIL_VERIFICATION ||= "false";
  process.env.AUTO_PHONE_VERIFICATION ||= "false";
  process.env.IS_2FA_FEATURE_ENABLED ||= "false";
  process.env.ENABLE_DEVICE_SOFT_REPLACE ||= "false";

  // First Name Setting
  process.env.FIRST_NAME_SETTING ||= "Optional";

  // Device Defaults
  process.env.DEVICE_NAME ||= "System Device";
  process.env.DEVICE_TYPE ||= "LAPTOP";
  process.env.DEVICE_UUID ||= "00000000-0000-4000-8000-000000000000";

  // Whitelist
  process.env.WHITELISTED_DEVICE_UUIDS ||= "";

}

module.exports = { applyEnvDefaults };
