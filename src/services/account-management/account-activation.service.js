const { UserModel } = require("@models/user.model");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { SecurityContext } = require("@configs/security.config");
const { verifyPasswordWithRateLimit } = require("../password-management/password-verification.service");
const { AuthErrorTypes } = require("@/configs/enums.config");

const activateAccountService = async (user, device, plainPassword, requestId) => {

    // Already active check
    if (user.isActive === true) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_ACTIVE,
            message: "Account is already active."
        };
    }

    // Verify password (rate-limited)
    const verification = await verifyPasswordWithRateLimit(
        user,
        plainPassword,
        SecurityContext.ACTIVATE_ACCOUNT
    );

    if (!verification.success) {
        return verification;
    }

    // Atomic activation
    const updatedUser = await UserModel.findOneAndUpdate(
        { _id: user._id, isActive: false },
        {
            $set: {
                isActive: true,
                lastActivatedAt: new Date()
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_ACTIVE,
            message: "Account already active."
        };
    }

    // Logs
    logWithTime(`✅ Account activated for User ${updatedUser.userId}`);

    logAuthEvent(
        updatedUser,
        device,
        requestId,
        AUTH_LOG_EVENTS.ACTIVATE,
        "User account activated manually.",
        null
    );

    // Notification
    const contactInfo = getUserContacts(updatedUser);

    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.accountReactivated,
        smsTemplate: userSmsTemplate.accountReactivated,
        data: { name: updatedUser.firstName || "User" }
    });

    return {
        success: true,
        message: "Account activated successfully."
    };
};

module.exports = { activateAccountService };
