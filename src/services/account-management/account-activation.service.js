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
const { AuthErrorTypes, UserTypes } = require("@/configs/enums.config");

// Import internal service clients
let adminPanelClient = null;
let softwareManagementClient = null;

try {
    adminPanelClient = require("@internals/internal-client/admin-panel.client");
    softwareManagementClient = require("@internals/internal-client/software-management.client");
} catch (err) {
    logWithTime(`⚠️  Internal service clients not available: ${err.message}`);
}

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

    // ===== FIRE-AND-FORGET: Notify internal services about account activation =====
    if (adminPanelClient || softwareManagementClient) {
        // Always call Admin Panel Service when account is activated
        if (adminPanelClient && adminPanelClient.toggleActiveStatus) {
            adminPanelClient.toggleActiveStatus(updatedUser.userId, true, updatedUser.userType).catch(err => {
                logWithTime(`⚠️  Failed to notify Admin Panel Service about account activation: ${err.message}`);
            });
        }
        
        // Call Software Management Service only if user type is CLIENT or ADMIN
        if ((updatedUser.userType === UserTypes.CLIENT || updatedUser.userType === UserTypes.ADMIN) && 
            softwareManagementClient && softwareManagementClient.toggleActiveStatus) {
            softwareManagementClient.toggleActiveStatus(updatedUser.userId, true, updatedUser.userType).catch(err => {
                logWithTime(`⚠️  Failed to notify Software Management Service about account activation: ${err.message}`);
            });
        }
    }

    return {
        success: true,
        message: "Account activated successfully."
    };
};

module.exports = { activateAccountService };
