const { hashPassword } = require("@/utils/auth.util");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { logoutUserCompletely } = require("../auth/auth-session.service");
const { UserModel } = require("@models/user.model");

/**
 * Service to reset password after OTP verification
 */

const resetPasswordService = async (user, device, newPassword) => {

    // 1️⃣ Hash password
    const hashedPassword = await hashPassword(newPassword);

    if (!hashedPassword) {
        return {
            success: false,
            message: "Password encryption failed."
        };
    }

    const updatedUser = await UserModel.findOneAndUpdate(
        { _id: user._id },
        {
            $set: {
                password: hashedPassword,
                passwordChangedAt: new Date(),
                "security.changePassword.failedAttempts": 0,
                "security.changePassword.lockoutUntil": null
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return {
            success: false,
            message: "Unable to reset password. Please try again."
        };
    }    

    // 3️⃣ 🔐 FORCE LOGOUT ALL DEVICES (CRITICAL)
    const isLoggedOut = await logoutUserCompletely(
        user,
        device,
        "Password Reset"
    );

    // 4️⃣ Logs
    logWithTime(`🔐 Password reset for UserID: ${user.userId}`);

    logAuthEvent(
        user,
        device,
        AUTH_LOG_EVENTS.RESET_PASSWORD,
        "Password reset via forgot password flow.",
        null
    );

    // 5️⃣ Notification
    const contactInfo = getUserContacts(user);

    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.passwordChanged,
        smsTemplate: userSmsTemplate.passwordChanged,
        data: { name: user.firstName || "User" }
    });

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