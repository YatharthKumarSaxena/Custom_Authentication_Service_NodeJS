// src/services/account-management/change-password.service.js

const { UserModel } = require("@models/user.model");
const { hashPassword } = require("@/utils/auth.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");

/**
 * Atomic password update service
 * @param {Object} user - User object
 * @param {String} newPassword - New password
 * @param {Object} device - Device object
 * @param {String} requestId - Request ID
 * @param {String} context - Context description (e.g., "Change Password", "Reset Password")
 * @param {String} eventType - Auth log event type (default: CHANGE_PASSWORD)
 */

const updatePassword = async (
    user, 
    newPassword, 
    device, 
    requestId, 
    context = "Change Password",
    eventType = AUTH_LOG_EVENTS.CHANGE_PASSWORD
) => {

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    if (!hashedPassword) {
        logWithTime(`❌ Password hashing failed for user ${user.userId}`);
        return false;
    }

    // Atomic DB update
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
        return false;
    }

    // Auth Log Event
    logAuthEvent(
        updatedUser,
        device,
        requestId,
        eventType,
        `Password changed via ${context}`,
        null
    );

    // Notification AFTER successful DB write
    const contactInfo = getUserContacts(updatedUser);

    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.passwordChanged,
        smsTemplate: userSmsTemplate.passwordChanged,
        data: { name: updatedUser.firstName || "User" }
    });

    return true;
};

module.exports = {
    updatePassword
};
