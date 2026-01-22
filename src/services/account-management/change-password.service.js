// src/services/password-management/password-update.service.js

const { hashPassword } = require("@/utils/auth.util");
const { errorMessage } = require("@/utils/error-handler.util");
const { logWithTime } = require("@/utils/time-stamps.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

/**
 * Updates the user's password in the database
 * Handles hashing and security field resets
 */

const updatePassword = async (user, newPassword) => {
    try {
        // 1. Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        if (!hashedPassword) {
            logWithTime(`❌ Password Hashing failed for User ${user.userId} in updatePassword service`);
            return false;
        }

        // 2. Update User Fields
        user.password = hashedPassword;
        user.passwordChangedAt = Date.now();

        // 3. Security Cleanup (Good Practice)
        if (user.security) {
            user.security.changePassword.failedAttempts = 0;
            user.security.changePassword.lastAttemptAt = null;
        }

        // 4. Save to Database
        await user.save();

        // 5. Send Notification
        const contactInfo = getUserContacts(user);
        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.passwordChanged,
            smsTemplate: userSmsTemplate.passwordChanged,
            data: { name: user.firstName || "User" }
        });

        return true;
    } catch (err) {
        logWithTime(`❌ Error in updatePassword service for userId: (${user.userId})`);
        errorMessage(err);
        return false;
    }
};

module.exports = {
    updatePassword
};