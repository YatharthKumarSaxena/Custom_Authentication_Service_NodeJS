const { UserModel } = require("@models/user.model");
const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { IS_TWO_FA_FEATURE_ENABLED, SecurityContext } = require("@configs/security.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { AuthErrorTypes } = require("@configs/enums.config");

/**
 * 🔐 Service to Toggle Two-Factor Authentication (2FA)
 * Atomic • Race-safe • Industry standard
 */
const toggleTwoFactorService = async (user, device, password, shouldEnable) => {

    // --------------------------------------------------
    // 0️⃣ Feature flag safety
    // --------------------------------------------------
    if (shouldEnable && !IS_TWO_FA_FEATURE_ENABLED) {
        return {
            success: false,
            type: AuthErrorTypes.FEATURE_DISABLED,
            message: "Two-factor authentication feature is currently disabled by system administrator."
        };
    }

    // --------------------------------------------------
    // 1️⃣ Password verification (rate-limited)
    // --------------------------------------------------
    const passwordVerification =
        await verifyPasswordWithRateLimit(
            user,
            password,
            SecurityContext.TOGGLE_2FA
        );

    if (passwordVerification.success === false) {
        return passwordVerification;
    }

    // --------------------------------------------------
    // 2️⃣ 🔥 Atomic toggle update
    // --------------------------------------------------
    const updatedUser = await UserModel.findOneAndUpdate(
        {
            _id: user._id,
            twoFactorEnabled: !shouldEnable
        },
        {
            $set: shouldEnable
                ? {
                    twoFactorEnabled: true,
                    twoFactorEnabledAt: new Date(),
                    twoFactorDisabledAt: null
                }
                : {
                    twoFactorEnabled: false,
                    twoFactorDisabledAt: new Date(),
                    twoFactorEnabledAt: null
                }
        },
        { new: true }
    );

    // Already same state → idempotent success
    if (!updatedUser) {
        return {
            success: true,
            type: AuthErrorTypes.ALREADY_IN_STATE,
            message: `Two-factor authentication is already ${shouldEnable ? "enabled" : "disabled"}.`
        };
    }

    // --------------------------------------------------
    // 3️⃣ Audit logs
    // --------------------------------------------------
    const action = shouldEnable ? "ENABLED" : "DISABLED";

    logWithTime(
        `🔐 2FA ${action} for UserID: ${updatedUser.userId} from device: ${device.deviceUUID}`
    );

    logAuthEvent(
        updatedUser,
        device,
        shouldEnable
            ? AUTH_LOG_EVENTS.ENABLE_2FA
            : AUTH_LOG_EVENTS.DISABLE_2FA,
        `User ${action.toLowerCase()} two-factor authentication.`,
        null
    );

    // --------------------------------------------------
    // 4️⃣ Notifications
    // --------------------------------------------------
    const contactInfo = getUserContacts(updatedUser);

    sendNotification({
        contactInfo,
        emailTemplate: shouldEnable
            ? userTemplate.twoFactorEnabled
            : userTemplate.twoFactorDisabled,
        smsTemplate: shouldEnable
            ? userSmsTemplate.twoFactorEnabled
            : userSmsTemplate.twoFactorDisabled,
        data: { name: updatedUser.firstName || "User" }
    });

    // --------------------------------------------------
    // 5️⃣ Final response
    // --------------------------------------------------
    return {
        success: true,
        message: `Two-factor authentication has been successfully ${shouldEnable ? "enabled" : "disabled"}.`
    };
};

module.exports = { toggleTwoFactorService };
