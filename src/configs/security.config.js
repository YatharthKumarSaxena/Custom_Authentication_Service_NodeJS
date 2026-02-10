const { VerificationPurpose } = require("./enums.config");
const { getMyEnv, getMyEnvAsNumber, getMyEnvAsBool, getMyEnvAsArray } = require("../utils/env.util");

module.exports = {
  SALT: getMyEnvAsNumber('SALT', 10),
  usersPerDevice: 1,
  deviceThreshold: {
    ADMIN: 1,
    CUSTOMER: 1
  },
  SecurityContext: {
    LOGIN: "login",
    CHANGE_PASSWORD: "changePassword",
    ACTIVATE_ACCOUNT: "activateAccount",
    DEACTIVATE_ACCOUNT: "deactivateAccount",
    TOGGLE_2FA: "toggle2FA"
  },
  authMode: getMyEnv('AUTH_MODE'),
  auditMode: getMyEnv('AUDIT_MODE'),
  verificationMode: getMyEnv('VERIFICATION_MODE'),
  otp: {
    length: 6,                // digits in OTP
    maxAttempts: 5,
    digits: "0123456789"      // OTP characters allowed
  },
  hashing: {
    algorithm: "sha256",
    encoding: "hex",
    saltLength: 16
  },
  passwordSecurity: {
    MAX_ATTEMPTS: 5,           // 5 baar galat password allow hai
    LOCKOUT_TIME_MINUTES: 15   // Uske baad 15 minute ka ban
  },
  verificationSecurity: {
    [VerificationPurpose.FORGOT_PASSWORD]: {
      MAX_ATTEMPTS: 5,
      OTP_EXPIRY_MINUTES: 5,
      LINK_EXPIRY_MINUTES: 10
    },

    [VerificationPurpose.EMAIL_VERIFICATION]: {
      MAX_ATTEMPTS: 3,
      OTP_EXPIRY_MINUTES: 10,
      LINK_EXPIRY_MINUTES: 30
    },

    [VerificationPurpose.PHONE_VERIFICATION]: {
      MAX_ATTEMPTS: 3,
      OTP_EXPIRY_MINUTES: 3,
      LINK_EXPIRY_MINUTES: 5
    },

    [VerificationPurpose.DEVICE_VERIFICATION]: {
      MAX_ATTEMPTS: 2,
      OTP_EXPIRY_MINUTES: 2,
      LINK_EXPIRY_MINUTES: 15
    },

    [VerificationPurpose.REGISTRATION]: {
      MAX_ATTEMPTS: 3,
      OTP_EXPIRY_MINUTES: 5,
      LINK_EXPIRY_MINUTES: 30
    }
  },
  AUTO_LOGIN_AFTER_VERIFICATION: getMyEnvAsBool('AUTO_LOGIN_AFTER_VERIFICATION'),
  AUTO_EMAIL_VERIFICATION: getMyEnvAsBool('AUTO_EMAIL_VERIFICATION'),
  AUTO_PHONE_VERIFICATION: getMyEnvAsBool('AUTO_PHONE_VERIFICATION'),
  IS_TWO_FA_FEATURE_ENABLED: getMyEnvAsBool('IS_2FA_FEATURE_ENABLED'),
  WHITELISTED_DEVICE_UUIDS: getMyEnvAsArray('WHITELISTED_DEVICE_UUIDS'),
  FIRST_NAME_SETTING: getMyEnv('FIRST_NAME_SETTING'),
  ADMIN: {
    NAME: getMyEnv('ADMIN_NAME', null),
    EMAIL: getMyEnv('ADMIN_EMAIL_ID', null),
    PASSWORD: getMyEnv('ADMIN_PASSWORD'),
    COUNTRY_CODE: getMyEnv('ADMIN_COUNTRY_CODE', null),
    LOCAL_NUMBER: getMyEnv('ADMIN_LOCAL_NUMBER', null)
  },
  DEVICE: {
    DEVICE_NAME: getMyEnv('DEVICE_NAME', "System Device"),
    DEVICE_TYPE: getMyEnv('DEVICE_TYPE', "LAPTOP"),
    DEVICE_UUID: getMyEnv('DEVICE_UUID', "00000000-0000-4000-8000-000000000000")
  },
  link: {
    length: 32,
    algorithm: "sha256",
    encoding: "hex",
    secret: getMyEnv('VERIFICATION_LINK_SECRET')
  },
  ENABLE_DEVICE_SOFT_REPLACE: getMyEnvAsBool('ENABLE_DEVICE_SOFT_REPLACE'),
  ENABLE_AUTH_SESSION_LOGGING: getMyEnvAsBool('ENABLE_AUTH_SESSION_LOGGING')
};
