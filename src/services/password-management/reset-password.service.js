const { hashPassword } = require("@/utils/auth.util");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { errorMessage } = require("@/utils/error-handler.util");

/**
 * Service to reset password after OTP verification
 */

const resetPasswordService = async (user, device, newPassword) => {
    try {
        // 1. Hash the new password
        const hashedPassword = hashPassword(newPassword);

        // 2. Update User Document
        user.password = hashedPassword;
        user.passwordChangedAt = new Date();

        // Safety: Agar security object hai to failed attempts reset kar do
        if (user.security?.changePassword) {
            user.security.changePassword.failedAttempts = 0;
        }

        await user.save();

        // 3. Log Success
        logWithTime(`🔐 Password reset successfully for UserID: ${user.userId} via device: ${device.deviceUUID}`);

        logAuthEvent(
            user,
            device,
            AUTH_LOG_EVENTS.CHANGE_PASSWORD, // Or RESET_PASSWORD if exists
            `User reset their password via forgot password flow.`,
            null
        );

        return {
            success: true,
            message: "Your password has been reset successfully. Please login with your new password."
        };
    } catch (err) {
        // Handle errors appropriately
        logWithTime(`❌ Error resetting password for UserID: ${user.userId} via device: ${device.deviceUUID}: ${err.message}`);
        errorMessage(err);
        return {
            success: false,
            message: "Something went wrong while resetting your password. Please try again later."
        };
    }
};

module.exports = { resetPasswordService };