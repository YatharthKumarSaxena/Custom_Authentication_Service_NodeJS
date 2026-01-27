const { VerificationPurpose } = require("./enums.config");

module.exports = {
  SALT: Number(process.env.SALT),
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
  authMode: process.env.AUTH_MODE,
  auditMode: process.env.AUDIT_MODE,
  verificationMode: process.env.VERIFICATION_MODE,
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
  AUTO_LOGIN_AFTER_VERIFICATION: process.env.AUTO_LOGIN_AFTER_VERIFICATION === 'true',
  AUTO_EMAIL_VERIFICATION: process.env.AUTO_EMAIL_VERIFICATION === 'true',
  AUTO_PHONE_VERIFICATION: process.env.AUTO_PHONE_VERIFICATION === 'true',
  IS_TWO_FA_FEATURE_ENABLED: process.env.IS_2FA_FEATURE_ENABLED === 'true',
  WHITELISTED_DEVICE_UUIDS: process.env.WHITELISTED_DEVICE_UUIDS ? process.env.WHITELISTED_DEVICE_UUIDS.split(',') : [],
  FIRST_NAME_SETTING: process.env.FIRST_NAME_SETTING,
  ADMIN: {
    NAME: process.env.ADMIN_NAME || null,
    EMAIL: process.env.ADMIN_EMAIL_ID || null,
    PASSWORD: process.env.ADMIN_PASSWORD,
    COUNTRY_CODE: process.env.ADMIN_COUNTRY_CODE || null,
    PHONE_NUMBER: process.env.ADMIN_NUMBER || null
  },
  DEVICE: {
    DEVICE_NAME: process.env.DEVICE_NAME || "System Device",
    DEVICE_TYPE: process.env.DEVICE_TYPE || "LAPTOP",
    DEVICE_UUID: process.env.DEVICE_UUID || "00000000-0000-4000-8000-000000000000"
  },
  link: {
    length: 32,
    algorithm: "sha256",
    encoding: "hex",
    secret: process.env.VERIFICATION_LINK_SECRET
  },
  ENABLE_DEVICE_SOFT_REPLACE: process.env.ENABLE_DEVICE_SOFT_REPLACE === 'true'
};
