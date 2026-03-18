const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { RESET_PASSWORD_WINDOW_MINUTES } = require("@configs/security.config");
const { logoutUserCompletely } = require("../auth/auth-session.service");
const { updatePassword } = require("@services/account-management/change-password.service");
const { UserModel } = require("@models/user.model");

/**
 * Service to reset password after OTP verification
 * Validates that resetPasswordEnabledAt is set and within the allowed time window
 */

const resetPasswordService = async (user, device, newPassword, requestId) => {

    // 1. Check if reset password window was enabled (resetPasswordEnabledAt is not null)
    if (!user.resetPasswordEnabledAt) {
        logWithTime(`⚠️ Reset password attempted without prior OTP verification for user ${user.userId}`);
        return {
            success: false,
            message: "Please verify with OTP first before resetting password."
        };
    }

    // 2. Check if the reset password window has expired
    const now = new Date();
    const resetEnabledAt = new Date(user.resetPasswordEnabledAt);
    const windowExpiryTime = new Date(resetEnabledAt.getTime() + RESET_PASSWORD_WINDOW_MINUTES * 60 * 1000);

    if (now > windowExpiryTime) {
        // Window expired - clear resetPasswordEnabledAt
        await UserModel.findByIdAndUpdate(
            user._id,
            { resetPasswordEnabledAt: null },
            { new: true, runValidators: false }
        );

        logWithTime(`⚠️ Reset password window expired for user ${user.userId}. Window was ${RESET_PASSWORD_WINDOW_MINUTES} minutes.`);
        return {
            success: false,
            message: `Password reset window expired. Please request a new reset link. (Window: ${RESET_PASSWORD_WINDOW_MINUTES} minutes)`
        };
    }

    // 3. Update password using shared service (includes hashing, DB update, auth log, notification)
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

    // 4. Clear resetPasswordEnabledAt after successful password change
    await UserModel.findByIdAndUpdate(
        user._id,
        { resetPasswordEnabledAt: null },
        { new: true, runValidators: false }
    );

    // 5. FORCE LOGOUT ALL DEVICES (CRITICAL)
    const isLoggedOut = await logoutUserCompletely(
        user,
        device,
        requestId,
        "Password Reset"
    );

    // Logs
    logWithTime(`🔐 Password reset successfully for UserID: ${user.userId}, resetPasswordEnabledAt cleared`);

    if (!isLoggedOut) {
        logWithTime(`⚠️ Warning: Password reset but global logout failed for User ${user.userId}`);
        return {
            success: true,
            message: "Password reset successful. You have been logged out from all devices.",
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