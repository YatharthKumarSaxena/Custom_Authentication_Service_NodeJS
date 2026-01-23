// src/services/password-management/password-update.service.js

const { UserModel } = require("@models/user.model");
const { hashPassword } = require("@/utils/auth.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

/**
 * 🔐 Atomic password update service
 */
const updatePassword = async (user, newPassword) => {

    // 1️⃣ Hash new password
    const hashedPassword = await hashPassword(newPassword);

    if (!hashedPassword) {
        logWithTime(`❌ Password hashing failed for user ${user.userId}`);
        return false;
    }

    // 2️⃣ Atomic DB update
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

    // 3️⃣ Notification AFTER successful DB write
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
