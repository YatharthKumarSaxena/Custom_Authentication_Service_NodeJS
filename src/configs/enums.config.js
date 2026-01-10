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

const LinkPurpose = Object.freeze({
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PHONE_VERIFICATION: "PHONE_VERIFICATION",
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
  DEVICE_VERIFICATION: "DEVICE_VERIFICATION"
});

const OTP_Purpose = Object.freeze({
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PHONE_VERIFICATION: "PHONE_VERIFICATION",
  DEVICE_VERIFICATION: "DEVICE_VERIFICATION"
});

module.exports = {
    AuthModes,
    UserTypes,
    DeviceTypes,
    LinkPurpose,
    OTP_Purpose
}