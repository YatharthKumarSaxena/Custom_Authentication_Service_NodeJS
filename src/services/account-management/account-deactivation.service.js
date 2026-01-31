const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { SecurityContext } = require("@configs/security.config");
const { UserModel } = require("@models/user.model");
const { AuthErrorTypes } = require("@configs/enums.config");

const deactivateAccountService = async (user, device, plainPassword, requestId) => {

    // Fast-fail
    if (user.isActive === false) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_DEACTIVATED,
            message: "Account is already deactivated."
        };
    }

    // Password verification (rate-limited)
    const passwordVerification =
        await verifyPasswordWithRateLimit(
            user,
            plainPassword,
            SecurityContext.DEACTIVATE_ACCOUNT
        );

    if (passwordVerification.success === false) {
        return passwordVerification;
    }

    // Atomic DB update
    const updatedUser = await UserModel.findOneAndUpdate(
        {
            _id: user._id,
            isActive: true
        },
        {
            $set: {
                isActive: false,
                lastDeactivatedAt: new Date()
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_DEACTIVATED,
            message: "Account already deactivated."
        };
    }

    // Logs
    logWithTime(
        `🚫 Account deactivated for UserID: ${updatedUser.userId} from device: ${device.deviceUUID}`
    );

    logAuthEvent(
        updatedUser,
        device,
        requestId,
        AUTH_LOG_EVENTS.DEACTIVATE,
        `User account with userId: ${updatedUser.userId} deactivated manually from device ${device.deviceUUID}.`,
        null
    );

    // Notification
    const contactInfo = getUserContacts(updatedUser);

    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.accountDeactivated,
        smsTemplate: userSmsTemplate.accountDeactivated,
        data: { name: updatedUser.firstName || "User" }
    });

    return {
        success: true,
        message: "Account deactivated successfully."
    };
};


module.exports = { deactivateAccountService };