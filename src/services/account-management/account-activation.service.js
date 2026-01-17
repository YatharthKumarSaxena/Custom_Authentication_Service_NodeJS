const { verifyPasswordWithRateLimit } = require("../auth/password.service"); // Reusing your robust password service
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

/**
 * Service to activate user account
 */
const activateAccountService = async (user, device, plainPassword) => {
    
    if(user.isActive === true){
        return {
            success: false,
            message: "Account is already active."
        }
    }
    
    // 1. Password Verification (With Rate Limiter Protection) 🛡️
    await verifyPasswordWithRateLimit(user, plainPassword);

    // 2. Update User State
    user.isActive = true;
    user.lastActivatedAt = Date.now();
    
    // Save changes
    await user.save();

    // 3. Log Success
    logWithTime(`✅ Account activated for UserID: ${user.userId} from device: ${device.deviceUUID}`);
    
    logAuthEvent(
        user, 
        device, 
        AUTH_LOG_EVENTS.ACTIVATE, 
        `User account with userId: ${user.userId} reactivated manually from device ${device.deviceUUID}.`,
        null
    );

    // Send Notification
    const contactInfo = getUserContacts(user);
    sendNotification({
        contactInfo,
        emailTemplate: userTemplate.accountReactivated,
        smsTemplate: userSmsTemplate.accountReactivated,
        data: { name: user.firstName || "User" }
    });

    return {
        success: true,
        message: "Account activated successfully."
    };
};

module.exports = { activateAccountService };