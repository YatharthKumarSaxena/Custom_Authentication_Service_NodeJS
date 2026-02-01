// ACCOUNT MANAGEMENT SUCCESS RESPONSES

const { OK } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const changePasswordSuccessResponse = (res, user, device, logoutStatusMsg) => {
    logWithTime(`✅ Password changed for User (${user.userId}) from device (${device.deviceUUID})`);
    return res.status(OK).json({
        success: true,
        message: "Password changed successfully.",
        notice: logoutStatusMsg
    });
};

const updateAccountNoChangeResponse = (res, message) => {
    return res.status(OK).json({
        success: true,
        message: message
    });
};

const updateAccountSuccessResponse = (res, result) => {
    let message = result.message;
    
    if (result.emailVerificationSent || result.phoneVerificationSent) {
        const verificationMessages = [];
        
        if (result.emailVerificationSent) {
            verificationMessages.push("Verification email sent to your new email address");
        }
        
        if (result.phoneVerificationSent) {
            verificationMessages.push("Verification code sent to your new phone number");
        }
        
        message = `Profile updated successfully. ${verificationMessages.join(". ")}.`;
    }
    
    return res.status(OK).json({
        success: true,
        message,
        updatedFields: result.updatedFields,
        emailVerificationSent: result.emailVerificationSent || false,
        phoneVerificationSent: result.phoneVerificationSent || false
    });
};

const twoFactorToggleSuccessResponse = (res, message) => {
    return res.status(OK).json({
        success: true,
        message: message
    });
};

const activateAccountSuccessResponse = (res, message) => {
    return res.status(OK).json({
        success: true,
        message: message,
        suggestion: "Please login to continue."
    });
};

const deactivateAccountSuccessResponse = (res, message) => {
    return res.status(OK).json({
        success: true,
        message: message,
        notice: "You have been logged out."
    });
};

const accountManagementSuccessResponses = {
    changePasswordSuccessResponse,
    updateAccountNoChangeResponse,
    updateAccountSuccessResponse,
    twoFactorToggleSuccessResponse,
    activateAccountSuccessResponse,
    deactivateAccountSuccessResponse
}

module.exports = {
    accountManagementSuccessResponses
};