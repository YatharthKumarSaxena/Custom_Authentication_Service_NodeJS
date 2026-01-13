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

const AuthErrorTypes = {
    LOCKED: "AUTH_LOCKED",
    INVALID_PASSWORD: "AUTH_INVALID_PASSWORD"
};

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

const Token = Object.freeze({
    ACCESS: "ACCESS",
    REFRESH: "REFRESH"
});

module.exports = {
    AuthModes,
    UserTypes,
    DeviceTypes,
    LinkPurpose,
    OTP_Purpose,
    ContactModes,
    Token,
    VerificationPurpose,
    VerifyMode,
    AuthErrorTypes,
    RequestLocation
}