const AuthModes = Object.freeze({
    EMAIL: "EMAIL",
    PHONE: "PHONE",
    BOTH: "BOTH",
    EITHER: "EITHER"
});

const UserTypes = Object.freeze({
    CUSTOMER: "CUSTOMER",
    ADMIN: "ADMIN"
});

const DeviceTypes = Object.freeze({
    MOBILE: "MOBILE",
    TABLET: "TABLET",
    LAPTOP: "LAPTOP"
});

const ContactModes = Object.freeze({
    EMAIL: "EMAIL",
    PHONE: "PHONE",
    BOTH: "BOTH"
});

const VerifyMode = Object.freeze({
  LINK: "LINK",
  OTP: "OTP"
});

const AuthErrorTypes = Object.freeze({
    LOCKED: "AUTH_LOCKED",
    INVALID_PASSWORD: "AUTH_INVALID_PASSWORD",
    ALREADY_LOGGED_IN: "AUTH_ALREADY_LOGGED_IN",
    SERVER_LIMIT_REACHED: "AUTH_SERVER_LIMIT_REACHED",
    SERVER_ERROR: "AUTH_SERVER_ERROR",
    RESOURCE_EXISTS: "AUTH_RESOURCE_EXISTS",
    RESOURCE_NOT_FOUND: "AUTH_RESOURCE_NOT_FOUND",
    FORBIDDEN: "AUTH_FORBIDDEN",
    INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
    ALREADY_ACTIVE: "AUTH_ALREADY_ACTIVE",
    ALREADY_DEACTIVATED: "AUTH_ALREADY_DEACTIVATED",
    FEATURE_DISABLED: "AUTH_FEATURE_DISABLED",
    ALREADY_IN_STATE: "AUTH_ALREADY_IN_STATE",
    INVALID_INPUT: "AUTH_INVALID_INPUT",
    NOTIFICATION_FAILED: "AUTH_NOTIFICATION_FAILED",
    GENERATION_FAILED: "AUTH_GENERATION_FAILED",
    ALREADY_SENT: "AUTH_ALREADY_SENT",
    INVALID_PURPOSE: "AUTH_INVALID_PURPOSE"
});

const VerificationPurpose = Object.freeze({
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PHONE_VERIFICATION: "PHONE_VERIFICATION",
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
  DEVICE_VERIFICATION: "DEVICE_VERIFICATION"
});

const RequestLocation = Object.freeze({
    BODY: "body",
    QUERY: "query",
    PARAMS: "params",
    HEADERS: "headers" // Future safety ke liye
});

const FirstNameFieldSetting = Object.freeze({
    OPTIONAL: "Optional",
    MANDATORY: "Mandatory",
    DISABLED: "Disabled"
});

const Token = Object.freeze({
    ACCESS: "ACCESS",
    REFRESH: "REFRESH"
});

module.exports = {
    AuthModes,
    UserTypes,
    DeviceTypes,
    ContactModes,
    Token,
    VerificationPurpose,
    VerifyMode,
    AuthErrorTypes,
    RequestLocation,
    FirstNameFieldSetting
}