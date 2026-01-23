const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { SecurityContext } = require("@configs/security.config");

const deactivateAccountService = async (user, device, plainPassword) => {

    // 0️⃣ Fast-fail
    if (user.isActive === false) {
        return {
            success: false,
            type: AuthErrorTypes.ALREADY_DEACTIVATED,
            message: "Account is already deactivated."
        };
    }

    // 1️⃣ Password verification (rate-limited)
    const passwordVerification =
        await verifyPasswordWithRateLimit(
            user,
            plainPassword,
            SecurityContext.DEACTIVATE_ACCOUNT
        );

    if (passwordVerification.success === false) {
        return passwordVerification;
    }

    // 2️⃣ 🔥 Atomic DB update
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
            message: "Account already deactivated."
        };
    }

    // 3️⃣ Logs
    logWithTime(
        `🚫 Account deactivated for UserID: ${updatedUser.userId} from device: ${device.deviceUUID}`
    );

    logAuthEvent(
        updatedUser,
        device,
        AUTH_LOG_EVENTS.DEACTIVATE,
        `User account with userId: ${updatedUser.userId} deactivated manually from device ${device.deviceUUID}.`,
        null
    );

    // 4️⃣ Notification
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