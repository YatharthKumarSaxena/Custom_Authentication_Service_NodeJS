const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { loginUserOnDevice } = require("../auth/auth-session.service");
const { createToken } = require("@utils/issue-token.util");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { authMode, AUTO_LOGIN_AFTER_VERIFICATION } = require("@/configs/security.config");
const { AuthModes, VerificationPurpose } = require("@/configs/enums.config");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { expiryTimeOfRefreshToken } = require("@/configs/token.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

/**
 * 🔒 PRIVATE HELPER (NOT EXPORTED)
 * Generic verification logic factory
 */

const performVerificationCore = async (user, device, code, contactMode, config) => {
    const { 
        purpose, updateField, logEvent, authModeType, otherVerifiedField, type 
    } = config;

    // 1️⃣ Validate Token
    const validation = await verifyVerification(user._id, purpose, code, contactMode);
    if (!validation.success) throw new Error(validation.message);

    // 2️⃣ Update User Status
    user[updateField] = true; 
    await user.save();

    logAuthEvent(user, device, logEvent, `User ID ${user.userId} verified ${type} via ${contactMode}.`, null);

    // 3️⃣ Send Welcome Notification (After First Verification)
    // Check if this is initial verification (email or phone) - send welcome
    if (purpose === VerificationPurpose.EMAIL_VERIFICATION || purpose === VerificationPurpose.PHONE_VERIFICATION) {
        const contactInfo = getUserContacts(user);
        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.welcome,
            smsTemplate: userSmsTemplate.welcome,
            data: { name: user.firstName || "User" }
        });
    }

    // 4️⃣ Auto Login Logic
    let autoLoggedIn = false;
    if (AUTO_LOGIN_AFTER_VERIFICATION) {
        
        const canLogin = 
            authMode === AuthModes.EITHER || 
            authMode === authModeType || 
            (authMode === AuthModes.BOTH && user[otherVerifiedField]);

        if (canLogin) {
            logWithTime(`🔄 Auto-login triggered for User (${user.userId}) after ${type} Verification.`);
            
            // 🛡️ CRITICAL FIX: Ensure req.user is set for loginUserOnDevice
            req.user = user; 

            const refreshTokenString = createToken(user.userId, expiryTimeOfRefreshToken, device.deviceUUID);
            if (!refreshTokenString) throw new Error("Token generation failed");

            const loginSuccess = await loginUserOnDevice(user, device, refreshTokenString, `Auto-Login (${type} Verified)`);
            if (loginSuccess) autoLoggedIn = true;
        }
    }

    return { success: true, autoLoggedIn };
};

// ==========================================
// 🚀 PUBLIC EXPORTS (Wrappers)
// ==========================================

const verifyEmailService = async (user, device, code, contactMode) => {
    return await performVerificationCore(user, device, code, contactMode, {
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        updateField: 'isEmailVerified',
        logEvent: AUTH_LOG_EVENTS.VERIFY_EMAIL,
        authModeType: AuthModes.EMAIL,
        otherVerifiedField: 'isPhoneVerified',
        type: "Email" // ✅ Added Type
    });
};

const verifyPhoneService = async (user, device, code, contactMode) => {
    return await performVerificationCore(user, device, code, contactMode, {
        purpose: VerificationPurpose.PHONE_VERIFICATION,
        updateField: 'isPhoneVerified',
        logEvent: AUTH_LOG_EVENTS.VERIFY_PHONE,
        authModeType: AuthModes.PHONE,
        otherVerifiedField: 'isEmailVerified',
        type: "Phone" // ✅ Added Type
    });
};

module.exports = { verifyEmailService, verifyPhoneService };