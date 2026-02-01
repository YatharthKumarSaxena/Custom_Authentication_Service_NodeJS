// ACCOUNT VERIFICATION SUCCESS RESPONSES

const { OK } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const resendVerificationSuccessReponse = (res, user, result) => {
    logWithTime(
        `✅ Verification resent for User ${user.userId} via ${result.contactMode}`
    );
    return res.status(OK).json({
        success: true,
        message: `Verification ${result.type === "OTP" ? "code" : "link"} has been resent successfully.`
    });
};

const verificationAlreadyVerifiedResponse = (res, message) => {
    return res.status(OK).json({
        success: true,
        message: message
    });
};

const verificationSuccessWithAutoLoginResponse = (res, successMessageBase, autoLoggedIn) => {
    let additionalMessage = autoLoggedIn ? " You have been automatically logged in." : "";
    
    return res.status(OK).json({
        success: true,
        message: `${successMessageBase} successfully. Your account is now active.` + additionalMessage,
        isAutoLoggedIn: autoLoggedIn
    });
};

const verificationSuccessWithLimitReachedResponse = (res, successMessageBase, result) => {
    return res.status(OK).json({
        success: true,
        message: `${successMessageBase} successfully but login was not possible. ${result.message}`,
        isAutoLoggedIn: false,
        limitReached: true,
        limitType: result.type === "DEVICE_USER_LIMIT_REACHED" ? "DEVICE_USER_LIMIT" : "SESSION_LIMIT"
    });
};

const accountVerificationSuccessResponses = {
    resendVerificationSuccessReponse,
    verificationAlreadyVerifiedResponse,
    verificationSuccessWithAutoLoginResponse,
    verificationSuccessWithLimitReachedResponse
}

module.exports = {
    accountVerificationSuccessResponses
};