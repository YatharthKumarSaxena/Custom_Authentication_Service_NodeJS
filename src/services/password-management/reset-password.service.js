const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { logoutUserCompletely } = require("../auth/auth-session.service");
const { updatePassword } = require("@services/account-management/change-password.service");

/**
 * Service to reset password after OTP verification
 */

const resetPasswordService = async (user, device, newPassword, requestId) => {

    // Update password using shared service (includes hashing, DB update, auth log, notification)
    const isUpdated = await updatePassword(
        user,
        newPassword,
        device,
        requestId,
        "Reset Password",
        AUTH_LOG_EVENTS.RESET_PASSWORD
    );

    if (!isUpdated) {
        return {
            success: false,
            message: "Unable to reset password. Please try again."
        };
    }

    // FORCE LOGOUT ALL DEVICES (CRITICAL)
    const isLoggedOut = await logoutUserCompletely(
        user,
        device,
        requestId,
        "Password Reset"
    );

    // Logs
    logWithTime(`🔐 Password reset for UserID: ${user.userId}`);

    if (!isLoggedOut) {
        logWithTime(`⚠️ Warning: Password reset but global logout failed for User ${user.userId}`);
        return {
            success: true,
            message: "Password reset but failed to logout from all devices.",
            isLoggedOut: false
        };
    }

    return {
        success: true,
        message:
            "Password reset successful. You have been logged out from all devices.",
        isLoggedOut: true
    };
};

module.exports = { resetPasswordService };