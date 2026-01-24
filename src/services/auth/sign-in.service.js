const { UserDeviceModel } = require("@/models/user-device.model");
const { DeviceModel } = require("@/models/device.model");
const { loginUserOnDevice } = require("./auth-session.service"); // Login Service
const { createToken } = require("@utils/issue-token.util");
const { AuthErrorTypes, VerificationPurpose, VerifyMode } = require("@configs/enums.config");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { generateVerificationForUser } = require("@services/account-verification/verification-generator.service");
const ms = require("ms");
const { getUserContacts } = require("@/utils/contact-selector.util");
const { verificationSecurity, IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");
const { verifyPasswordWithRateLimit } = require("../password-management/password-verification.service");
const { SecurityContext } = require('@configs/security.config');
const { sendNotification } = require("@/utils/notification-dispatcher.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

const performSignIn = async (user, deviceInput, plainPassword) => {

    // ---------------------------------------------------------
    // STEP 1: Already logged-in check
    // ---------------------------------------------------------
    const existingDevice = await DeviceModel.findOne({
        deviceUUID: deviceInput.deviceUUID
    });

    if (existingDevice) {
        const activeSession = await UserDeviceModel.findOne({
            userId: user._id,
            deviceId: existingDevice._id,
            refreshToken: { $ne: null }
        });

        if (activeSession) {

            const expiryMs = ms(expiryTimeOfRefreshToken);
            const issuedAt = new Date(activeSession.jwtTokenIssuedAt).getTime();

            if (Date.now() < issuedAt + expiryMs) {
                return {
                    success: false,
                    type: AuthErrorTypes.ALREADY_LOGGED_IN,
                    message: "You are already logged in on this device. Please logout first."
                };
            }
        }
    }

    // ---------------------------------------------------------
    // STEP 2: Password verification
    // ---------------------------------------------------------
    const passwordCheck = await verifyPasswordWithRateLimit(
        user,
        plainPassword,
        SecurityContext.LOGIN
    );

    if (passwordCheck?.success === false) {
        return passwordCheck;
    }

    // ---------------------------------------------------------
    // STEP 3: 2FA FLOW
    // ---------------------------------------------------------
    if (IS_TWO_FA_FEATURE_ENABLED && user.twoFactorEnabled) {

        const { contactMode } = getUserContacts(user);

        let targetDeviceId;

        if (existingDevice) {
            targetDeviceId = existingDevice._id;
        } else {
            const newDevice = await DeviceModel.findOneAndUpdate(
                { deviceUUID: deviceInput.deviceUUID },
                {
                    deviceName: deviceInput.deviceName,
                    deviceType: deviceInput.deviceType
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            targetDeviceId = newDevice._id;
        }

        const verificationResult =
            await generateVerificationForUser(
                user,
                targetDeviceId,
                VerificationPurpose.DEVICE_VERIFICATION,
                contactMode
            );

        // ❌ system failure
        if (!verificationResult) {
            return {
                success: false,
                type: AuthErrorTypes.SERVER_ERROR,
                message: "Failed to initiate two-factor authentication."
            };
        }

        // ⏳ already sent
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

    // ---------------------------------------------------------
    // STEP 4: Normal Login
    // ---------------------------------------------------------
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