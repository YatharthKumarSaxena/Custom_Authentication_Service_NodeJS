const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { SecurityContext } = require("@configs/security.config");
const { AuthErrorTypes } = require("@configs/enums.config");
const { OTPModel, VerificationLinkModel, UserDeviceModel, UserModel } = require("@models/index");

/**
 * Hard Delete Account Service
 * Permanently removes user and all associated data
 */
const hardDeleteAccountService = async (user, device, plainPassword, requestId) => {

    // Password verification
    const passwordVerification = await verifyPasswordWithRateLimit(
        user,
        plainPassword,
        SecurityContext.HARD_DELETE_ACCOUNT
    );

    if (passwordVerification.success === false) {
        return passwordVerification;
    }

    const userId = user._id;
    const userIdStr = user.userId;

    try {

        const session = await UserModel.startSession();

        try {
            await session.withTransaction(async () => {
                // Delete in order: dependencies first, then user
                await UserDeviceModel.deleteMany({ userId }, { session });
                await VerificationLinkModel.deleteMany({ userId }, { session });
                await OTPModel.deleteMany({ userId }, { session });
                await UserModel.deleteOne({ _id: userId }, { session });
            });

        } finally {
            await session.endSession();
        }

        // ===== SUCCESS FLOW =====

        logWithTime(
            `🗑️ Account permanently deleted for UserID: ${userIdStr} from device: ${device.deviceUUID}`
        );

        logAuthEvent(
            user,
            device,
            requestId,
            AUTH_LOG_EVENTS.HARD_DELETE,
            `User account with userId: ${userIdStr} permanently deleted from device ${device.deviceUUID}.`,
            null
        );

        const contactInfo = getUserContacts(user);

        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.accountPermanentlyDeleted,
            smsTemplate: userSmsTemplate.accountPermanentlyDeleted,
            data: {
                name: user.firstName || "User",
                userId: userIdStr
            }
        });

        return {
            success: true,
            message: "Account and all associated data have been permanently deleted. You will need to create a new account to use our services again."
        };

    } catch (err) {

        logWithTime(`❌ Hard delete failed for User ${userIdStr}: ${err.message}`);

        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "Failed to delete account. Please try again later."
        };
    }
};

module.exports = {
    hardDeleteAccountService
};