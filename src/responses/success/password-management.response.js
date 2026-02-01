// PASSWORD MANAGEMENT SUCCESS RESPONSES

const { OK } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const forgotPasswordSuccessResponse = (res, user, result) => {
    const responses = [];
    if (result.email) responses.push("Email sent");
    if (result.phone) responses.push("SMS sent");

    logWithTime(`✅ Forgot password process initiated for User ${user.userId} via ${responses.join(" & ")}`);

    return res.status(OK).json({
        success: true,
        message: `Password reset initiated. ${responses.join(" & ")}.`
    });
};

const resetPasswordSuccessResponse = (res, user, device, isLoggedOut) => {
    logWithTime(`✅ Password reset successful for User ${user.userId} from device ${device.deviceUUID}`);
    
    if (!isLoggedOut) {
        return res.status(OK).json({
            success: true,
            message: "Password reset successfully.",
            notice: "Warning: Unable to log out all active sessions. Please verify your account security."
        });
    }
    
    return res.status(OK).json({
        success: true,
        message: "Password reset successfully.",
        notice: "All active sessions have been terminated. Please login with your new password."
    });
};

const passwordManagementSuccessResponses = {
    forgotPasswordSuccessResponse,
    resetPasswordSuccessResponse
}

module.exports = {
    passwordManagementSuccessResponses
};