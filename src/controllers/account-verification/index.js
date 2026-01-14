const { resendVerificationLink } = require("./resend-verification-link.controller");
const { resendVerificationOTP } = require("./resend-verification-otp.controller");
const { verifyEmail, verifyDevice, verifyPhone } = require("./verification.controller");

const accountVerificationController = {
    resendVerificationLink,
    resendVerificationOTP,
    verifyEmail,
    verifyPhone,
    verifyDevice
}

module.exports = { 
    accountVerificationController 
};