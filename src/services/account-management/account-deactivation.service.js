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
const { AuthErrorTypes, DeletionPolicy } = require("@configs/enums.config");
const cronConfig = require("@configs/cron.config");

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
    
    const currentPolicy = DELETION_POLICY;
    const isSoftDeletePolicy = currentPolicy === DeletionPolicy.SOFT_DELETE || currentPolicy === DeletionPolicy.HYBRID;

    sendNotification({
        contactInfo,
        emailTemplate: isSoftDeletePolicy ? userTemplate.accountSoftDeleted : userTemplate.accountDeactivated,
        smsTemplate: isSoftDeletePolicy ? userSmsTemplate.accountSoftDeleted : userSmsTemplate.accountDeactivated,
        data: { 
            name: updatedUser.firstName || "User",
            recoveryDays: recoveryDays
        }
    });

    return {
        success: true,
        message: `Account deactivated successfully. You can recover your account by logging in within ${recoveryDays} days.`,
        recoveryDays: isSoftDeletePolicy ? recoveryDays : undefined
    };
};


module.exports = { deactivateAccountService };