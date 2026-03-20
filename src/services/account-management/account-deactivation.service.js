const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { SecurityContext, DELETION_POLICY } = require("@configs/security.config");
const { UserModel } = require("@models/user.model");
const { AuthErrorTypes, DeletionPolicy, UserTypes } = require("@configs/enums.config");
const cronConfig = require("@configs/cron.config");

// Import internal service clients
let adminPanelClient = null;
let softwareManagementClient = null;

try {
    adminPanelClient = require("@internals/internal-client/admin-panel.client");
    softwareManagementClient = require("@internals/internal-client/software-management.client");
} catch (err) {
    logWithTime(`⚠️  Internal service clients not available: ${err.message}`);
}

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

    // Get recovery days from cron config
    const recoveryDays = cronConfig.userCleanup.deactivatedRetentionDays || 60;

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

    const currentPolicy = DELETION_POLICY;
    const isSoftDeletePolicy = currentPolicy === DeletionPolicy.SOFT_DELETE || currentPolicy === DeletionPolicy.HYBRID;
 
    logAuthEvent(
        updatedUser,
        device,
        requestId,
        AUTH_LOG_EVENTS.DEACTIVATE,
        `User account with userId: ${updatedUser.userId} ${isSoftDeletePolicy ? 'soft-deleted (recoverable)' : 'deactivated'} from device ${device.deviceUUID}.`,
        null
    );

    // Notification - use soft delete template if policy is SOFT_DELETE or HYBRID
    const contactInfo = getUserContacts(updatedUser);

    sendNotification({
        contactInfo,
        emailTemplate: isSoftDeletePolicy ? userTemplate.accountSoftDeleted : userTemplate.accountDeactivated,
        smsTemplate: isSoftDeletePolicy ? userSmsTemplate.accountSoftDeleted : userSmsTemplate.accountDeactivated,
        data: { 
            name: updatedUser.firstName || "User",
            recoveryDays: recoveryDays
        }
    });

    // ===== FIRE-AND-FORGET: Notify internal services about account deactivation =====
    if (adminPanelClient || softwareManagementClient) {
        // Always call Admin Panel Service when account is deactivated
        if (adminPanelClient && adminPanelClient.toggleActiveStatus) {
            adminPanelClient.toggleActiveStatus(updatedUser.userId, false, updatedUser.userType).catch(err => {
                logWithTime(`⚠️  Failed to notify Admin Panel Service about account deactivation: ${err.message}`);
            });
        }
        
        // Call Software Management Service only if user type is CLIENT or ADMIN
        if ((updatedUser.userType === UserTypes.CLIENT || updatedUser.userType === UserTypes.ADMIN) && 
            softwareManagementClient && softwareManagementClient.toggleActiveStatus) {
            softwareManagementClient.toggleActiveStatus(updatedUser.userId, false, updatedUser.userType).catch(err => {
                logWithTime(`⚠️  Failed to notify Software Management Service about account deactivation: ${err.message}`);
            });
        }
    }

    return {
        success: true,
        message: `Account deactivated successfully. You can recover your account by logging in within ${recoveryDays} days.`,
        recoveryDays: isSoftDeletePolicy ? recoveryDays : undefined
    };
};


module.exports = { deactivateAccountService };