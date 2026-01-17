const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service"); 
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

/**
 * Service to deactivate user account
 * Clean Service: No req/res, No Logout Logic.
 */
const deactivateAccountService = async (user, device, plainPassword) => {
    
    // 1. Password Verification (With Rate Limiter) 🛡️
    await verifyPasswordWithRateLimit(user, plainPassword);

    // 2. Update User State
    user.isActive = false;
    user.lastDeactivatedAt = new Date();
    
    // Save changes
    await user.save();

    // 3. Log Success
    logWithTime(`🚫 Account deactivated for UserID: ${user.userId} from device: ${device.deviceUUID}`);
    
    logAuthEvent(
        user, 
        device, 
        AUTH_LOG_EVENTS.DEACTIVATE, 
        `User account with userId: ${user.userId} deactivated manually from device ${device.deviceUUID}.`,
        null
    );

    // Send Notification
    const contactInfo = getUserContacts(user);
    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.accountDeactivated,
        smsTemplate: userSmsTemplate.accountDeactivated,
        data: { name: user.firstName || "User" }
    });

    return {
        success: true,
        message: "Account deactivated successfully."
    };
};

module.exports = { deactivateAccountService };