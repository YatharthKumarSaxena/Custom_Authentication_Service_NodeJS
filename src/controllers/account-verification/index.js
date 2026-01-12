const { resendVerificationLink } = require("./resend-verification-link.controller");
const { resendVerificationOTP } = require("./resend-verification-otp.controller");
const { verifyDevice } = require("./verify-device.controller");
const { verifyEmail } = require("./verify-email.controller");
const { verifyPhoneNumber } = require("./verify-phone-number.controller");

const accountVerificationController = {
    resendVerificationLink,
    resendVerificationOTP,
    verifyDevice,
    verifyEmail,
    verifyPhoneNumber
}

module.exports = { 
    accountVerificationController 
};