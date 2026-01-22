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
const { DeviceModel } = require("@models/device.model");

/**
 * 🔒 PRIVATE CORE
 */
const performVerificationCore = async (user, device, code, contactMode, config) => {
    const {
        purpose,
        updateField,
        logEvent,
        authModeType,
        otherVerifiedField,
        type
    } = config;

    // ✅ ensure device exists
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: device.deviceUUID },
        {
            deviceName: device.deviceName,
            deviceType: device.deviceType
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ✅ verify OTP / LINK
    const validation = await verifyVerification(
        user._id,
        deviceDoc._id,
        purpose,
        code,
        contactMode
    );

    if (!validation.success) {
        return { success: false, message: validation.message };
    }

    // ✅ mark verified
    user[updateField] = true;
    await user.save();

    logAuthEvent(
        user,
        device,
        logEvent,
        `User ${user.userId} verified ${type} via ${contactMode}`,
        null
    );

    let checkUserIsVerified = false;
    if(authMode === AuthModes.BOTH){
        checkUserIsVerified = user["isEmailVerified"] && user["isPhoneVerified"];
    } else if (authMode === AuthModes.EMAIL){
        checkUserIsVerified = user["isEmailVerified"];
    } else if (authMode === AuthModes.PHONE){
        checkUserIsVerified = user["isPhoneVerified"];
    } else {
        checkUserIsVerified = user["isEmailVerified"] || user["isPhoneVerified"];
    }

    // ✅ welcome notification
    if (
        checkUserIsVerified
    ) {
        const contactInfo = getUserContacts(user);
        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.welcome,
            smsTemplate: userSmsTemplate.welcome,
            data: { name: user.firstName || "User" }
        });
    }

    // ✅ auto login
    let autoLoggedIn = false;

    if (AUTO_LOGIN_AFTER_VERIFICATION) {
        const canLogin =
            authMode === AuthModes.EITHER ||
            authMode === authModeType ||
            (authMode === AuthModes.BOTH && user[otherVerifiedField]);

        if (canLogin) {
            logWithTime(
                `🔄 Auto-login triggered for User (${user.userId}) after ${type} verification`
            );

            const refreshToken = createToken(
                user.userId,
                expiryTimeOfRefreshToken,
                device.deviceUUID
            );

            if (!refreshToken) {
                return {
                    success: false,
                    message: "Token generation failed."
                };
            }

            const loginSuccess = await loginUserOnDevice(
                user,
                device,
                refreshToken,
                `Auto-Login (${type} Verified)`
            );

            if (loginSuccess) {
                autoLoggedIn = true;
            }
        }
    }

    return { success: true, autoLoggedIn };
};

// ===================================================
// 🚀 PUBLIC SERVICES
// ===================================================

const verifyEmailService = (user, device, code, contactMode) =>
    performVerificationCore(user, device, code, contactMode, {
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        updateField: "isEmailVerified",
        logEvent: AUTH_LOG_EVENTS.VERIFY_EMAIL,
        authModeType: AuthModes.EMAIL,
        otherVerifiedField: "isPhoneVerified",
        type: "Email"
    });

const verifyPhoneService = (user, device, code, contactMode) =>
    performVerificationCore(user, device, code, contactMode, {
        purpose: VerificationPurpose.PHONE_VERIFICATION,
        updateField: "isPhoneVerified",
        logEvent: AUTH_LOG_EVENTS.VERIFY_PHONE,
        authModeType: AuthModes.PHONE,
        otherVerifiedField: "isEmailVerified",
        type: "Phone"
    });

module.exports = {
    verifyEmailService,
    verifyPhoneService
};
