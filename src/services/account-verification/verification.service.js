const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { loginUserOnDevice } = require("../auth/auth-session.service");
const { loginPolicyChecker } = require("../auth/login-policy-checker.service"); // Policy Checker
const { createToken } = require("@utils/issue-token.util");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { authMode, AUTO_LOGIN_AFTER_VERIFICATION } = require("@/configs/security.config");
const { AuthModes, VerificationPurpose, AuthErrorTypes } = require("@/configs/enums.config");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { expiryTimeOfRefreshToken } = require("@/configs/token.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { DeviceModel } = require("@models/device.model");
const { UserModel } = require("@models/user.model");

/**
 * PRIVATE CORE
 */
const performVerificationCore = async (user, device, requestId, code, contactMode, config) => {
    const {
        purpose,
        updateField,
        logEvent,
        authModeType,
        otherVerifiedField,
        type
    } = config;

    if (user[updateField]) {
        return {
            success: true,
            type: AuthErrorTypes.ALREADY_VERIFIED,
            message: `${type} already verified.`
        };
    }

    // Ensure device
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: device.deviceUUID },
        {
            deviceName: device.deviceName,
            deviceType: device.deviceType
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Verify OTP / LINK
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

    // LINK verification may return fresh user
    const verifiedUser = validation.user || user;

    // ATOMIC VERIFICATION UPDATE
    const updateResult = await UserModel.updateOne(
        { _id: verifiedUser._id, [updateField]: false },
        { $set: { [updateField]: true } }
    );

    if (updateResult.modifiedCount === 0) {
        return {
            success: false,
            message: `${type} already verified.`
        };
    }

    verifiedUser[updateField] = true;

    // Logs
    logAuthEvent(
        verifiedUser,
        device,
        requestId,
        logEvent,
        `User ${verifiedUser.userId} verified ${type}`,
        null
    );

    // Check full verification
    let fullyVerified = false;

    if (authMode === AuthModes.BOTH) {
        fullyVerified = verifiedUser.isEmailVerified && verifiedUser.isPhoneVerified;
    } else if (authMode === AuthModes.EMAIL) {
        fullyVerified = verifiedUser.isEmailVerified;
    } else if (authMode === AuthModes.PHONE) {
        fullyVerified = verifiedUser.isPhoneVerified;
    } else {
        fullyVerified = verifiedUser.isEmailVerified || verifiedUser.isPhoneVerified;
    }

    // Welcome notification
    if (fullyVerified) {
        const contactInfo = getUserContacts(verifiedUser);

        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.welcome,
            smsTemplate: userSmsTemplate.welcome,
            data: { name: verifiedUser.firstName || "User" }
        });
    }

    // Auto login
    let autoLoggedIn = false;

    if (AUTO_LOGIN_AFTER_VERIFICATION) {
        const canLogin =
            authMode === AuthModes.EITHER ||
            authMode === authModeType ||
            (authMode === AuthModes.BOTH && verifiedUser[otherVerifiedField]);

        if (canLogin) {
            logWithTime(`🔄 Auto-login after ${type} verification for ${verifiedUser.userId}`);

            // Login Policy Check
            const policyCheck = await loginPolicyChecker({
                user: verifiedUser,
                deviceId: deviceDoc._id
            });

            if (!policyCheck.allowed) {
                return {
                    success: false,
                    type: policyCheck.type,
                    message: policyCheck.message
                };
            }

            const refreshToken = createToken(
                verifiedUser.userId,
                expiryTimeOfRefreshToken,
                device.deviceUUID
            );

            if (!refreshToken) {
                return { success: false, message: "Token generation failed." };
            }

            const loginSuccess = await loginUserOnDevice(
                verifiedUser,
                device,
                requestId,
                refreshToken,
                `Auto-Login (${type} Verified)`
            );

            autoLoggedIn = !!loginSuccess;
        }
    }

    return { success: true, autoLoggedIn };
};

// PUBLIC SERVICES

const verifyEmailService = (user, device, requestId, code, contactMode) =>
    performVerificationCore(user, device, requestId, code, contactMode, {
        purpose: VerificationPurpose.EMAIL_VERIFICATION,
        updateField: "isEmailVerified",
        logEvent: AUTH_LOG_EVENTS.VERIFY_EMAIL,
        authModeType: AuthModes.EMAIL,
        otherVerifiedField: "isPhoneVerified",
        type: "Email"
    });

const verifyPhoneService = (user, device, requestId, code, contactMode) =>
    performVerificationCore(user, device, requestId, code, contactMode, {
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
