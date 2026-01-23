const { resendVerification } = require("./resend-verification.controller");
const { verifyEmail, verifyDevice, verifyPhone } = require("./verification.controller");

const accountVerificationController = {
    resendVerification,
    verifyEmail,
    verifyPhone,
    verifyDevice
}

module.exports = { 
    accountVerificationController 
};