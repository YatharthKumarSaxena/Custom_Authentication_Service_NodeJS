const { UserDeviceModel } = require("@/models/user-device.model");
const { DeviceModel } = require("@/models/device.model");
const { loginUserOnDevice } = require("./auth-session.service"); // Login Service
const { loginPolicyChecker } = require("./login-policy-checker.service"); // Policy Checker
const { createToken } = require("@utils/issue-token.util");
const { AuthErrorTypes, VerificationPurpose, VerifyMode } = require("@configs/enums.config");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const { getUserContacts } = require("@/utils/contact-selector.util");
const { verificationSecurity, IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");
const { verifyPasswordWithRateLimit } = require("../password-management/password-verification.service");
const { SecurityContext } = require('@configs/security.config');
const { sendNotification } = require("@/utils/notification-dispatcher.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");
const { logWithTime } = require("@utils/time-stamps.util");

const performSignIn = async (user, deviceInput, plainPassword, requestId) => {

    // Check User sessions per device and devices per user
    
    // STEP 1: Password verification
    
    const passwordCheck = await verifyPasswordWithRateLimit(
        user,
        plainPassword,
        SecurityContext.LOGIN
    );

    if (passwordCheck?.success === false) {
        return passwordCheck;
    }

    let enable2FA = false;
    let targetDeviceId = null;

    if (IS_TWO_FA_FEATURE_ENABLED && user.twoFactorEnabled) {

        // Query or create device for 2FA
        const deviceDoc = await DeviceModel.findOneAndUpdate(
            { deviceUUID: deviceInput.deviceUUID },
            {
                deviceName: deviceInput.deviceName,
                deviceType: deviceInput.deviceType
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const userDevice = await UserDeviceModel.findOne({
            userId: user._id,
            deviceId: deviceDoc._id,
            twoFactorVerifiedAt: { $ne: null }
        }).lean();

        if (userDevice && userDevice.twoFactorVerifiedAt) {
            logWithTime(
                `🔐 Trusted device login | user=${user.userId} | device=${deviceInput.deviceUUID}`
            );
        } else {
            enable2FA = true;
        }

        targetDeviceId = deviceDoc._id;
    }
    
    // STEP 2: 2FA FLOW
    
    if (enable2FA) {

        const { contactMode } = getUserContacts(user);

        const verificationResult =
            await generateVerificationForUser(
                user,
                targetDeviceId,
                VerificationPurpose.DEVICE_VERIFICATION,
                contactMode
            );

        // system failure
        if (!verificationResult) {
            return {
                success: false,
                type: AuthErrorTypes.SERVER_ERROR,
                message: "Failed to initiate two-factor authentication."
            };
        }

        // already sent
        if (verificationResult.reused) {
            return {
                success: true,
                requires2FA: true,
                rateLimited: true,
                retryAfter: verificationResult.expiresAt,
                message: "Verification already sent. Please wait."
            };
        }

        const expiryMs =
            verificationSecurity[VerificationPurpose.DEVICE_VERIFICATION].LINK_EXPIRY_MINUTES
            * 60 * 1000;

        await UserDeviceModel.findOneAndUpdate(
            {
                userId: user._id,
                deviceId: targetDeviceId
            },
            {
                $set: {
                    verificationInitiatedAt: new Date(),
                    verificationExpiresAt: new Date(Date.now() + expiryMs),
                    failed2FAAttempts: 0
                },
                $setOnInsert: { firstSeenAt: new Date() }
            },
            { upsert: true }
        );

        const { type, token } = verificationResult;

        const contactInfo = getUserContacts(user);

        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.deviceVerification,
            smsTemplate: userSmsTemplate.deviceVerification,
            data: {
                name: user.firstName || "User",
                otp: type === VerifyMode.OTP ? token : undefined,
                link: type === VerifyMode.LINK ? token : undefined
            }
        });

        return {
            success: true,
            requires2FA: true,
            message: "Two-factor authentication required."
        };
    }

    // STEP 3: Normal Login

    // Get or create device for policy check
    const deviceDoc = await DeviceModel.findOneAndUpdate(
        { deviceUUID: deviceInput.deviceUUID },
        {
            deviceName: deviceInput.deviceName,
            deviceType: deviceInput.deviceType
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Login Policy Check
    const policyCheck = await loginPolicyChecker({
        user,
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
        user.userId,
        expiryTimeOfRefreshToken,
        deviceInput.deviceUUID
    );

    if (!refreshToken) {
        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "Token generation failed."
        };
    }

    const loginSuccess = await loginUserOnDevice(
        user,
        deviceInput,
        requestId,
        refreshToken,
        "Standard Sign-In"
    );

    if (!loginSuccess) {
        return {
            success: false,
            type: AuthErrorTypes.SERVER_ERROR,
            message: "Failed to create login session."
        };
    }

    return {
        success: true,
        requires2FA: false,
        message: "Login successful."
    };
};

module.exports = { performSignIn };