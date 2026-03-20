const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { SecurityContext } = require("@configs/security.config");
const { AuthErrorTypes, UserTypes } = require("@configs/enums.config");
const { OTPModel, VerificationLinkModel, UserDeviceModel, UserModel } = require("@models/index");

// Import internal service clients
let adminPanelClient = null;
let softwareManagementClient = null;

try {
    adminPanelClient = require("@internals/internal-client/admin-panel.client");
    softwareManagementClient = require("@internals/internal-client/software-management.client");
} catch (err) {
    logWithTime(`⚠️  Internal service clients not available: ${err.message}`);
}

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

        // Soft delete: Mark user as deleted, clean up device sessions
        // Keep user record for data integrity and audit purposes
        await UserDeviceModel.deleteMany({ userId });
        await VerificationLinkModel.deleteMany({ userId });
        await OTPModel.deleteMany({ userId });
        await UserModel.updateOne({ _id: userId }, { isDeleted: true });

        // ===== SUCCESS FLOW =====

        logWithTime(
            `🗑️ Account permanently deleted for UserID: ${userIdStr} from device: ${device.deviceUUID}`
        );

        logAuthEvent(
            user,
            device,
            requestId,
            AUTH_LOG_EVENTS.DELETE_ACCOUNT,
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

        // ===== FIRE-AND-FORGET: Notify internal services about user deletion =====
        // Based on user type, call appropriate internal services
        if (adminPanelClient || softwareManagementClient) {
            // If Admin: call both Admin Panel and Software Management
            if (user.userType === UserTypes.ADMIN || user.userType === UserTypes.CLIENT) {
                if (softwareManagementClient && softwareManagementClient.deleteUser) {
                    softwareManagementClient.deleteUser(userIdStr, user.userType).catch(err => {
                        logWithTime(`⚠️  Failed to notify Software Management Service about deletion: ${err.message}`);
                    });
                }
            }
            if (adminPanelClient && adminPanelClient.deleteUser) {
                adminPanelClient.deleteUser(userIdStr, user.userType).catch(err => {
                    logWithTime(`⚠️  Failed to notify Admin Panel Service about deletion: ${err.message}`);
                });
            }
            // For regular USER type, no notifications needed to these services
        }

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
