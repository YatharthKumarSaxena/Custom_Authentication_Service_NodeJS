const { UserDeviceModel, DeviceModel } = require("@models/index");
const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { VerificationPurpose, VerifyMode, AuthModes, AuthErrorTypes } = require("@configs/enums.config");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { createToken } = require("@utils/issue-token.util");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { loginUserOnDevice } = require("../auth/auth-session.service");
const { loginPolicyChecker } = require("../auth/login-policy-checker.service"); // Policy Checker
const { verificationMode, authMode } = require("@configs/security.config");

const {
    checkIsDeviceLocked,
    handleFailedDeviceAttempt,
    resetDeviceAttempts
} = require("@/services/account-verification/device-verification-security.service");

const verifyDeviceService = async (user, device, code, contactMode) => {

    // 🔐 Guard
    if (!user.twoFactorEnabled) {
        return {
            success: false,
            message: "Two-factor authentication is not enabled for this account."
        };
    }


    const isOtpFlow =
        verificationMode === VerifyMode.OTP ||
        authMode !== AuthModes.EMAIL;

    let deviceDoc = null;
    let userDeviceMapping = null;

    // --------------------------------------------------
    // OTP FLOW → device binding + lock + attempts
    // --------------------------------------------------
    if (isOtpFlow) {

        deviceDoc = await DeviceModel.findOne({
            deviceUUID: device.deviceUUID
        }).lean();

        if (!deviceDoc) {
            return {
                success: false,
                message: "OTP must be verified from the same device."
            };
        }

        userDeviceMapping = await UserDeviceModel.findOne({
            userId: user._id,
            deviceId: deviceDoc._id
        }).lean();

        if (!userDeviceMapping) {
            return {
                success: false,
                message: "No verification code was issued for this device."
            };
        }

        if (userDeviceMapping.twoFactorVerifiedAt) {
            logWithTime(
                `ℹ️  Device (${device.deviceUUID}) already verified for User (${user.userId})`
            );
            return {
                success: true,
                type: AuthErrorTypes.ALREADY_VERIFIED,
                message: "This device is already verified."
            };
        }

        // 🔒 device lock
        const lockStatus = checkIsDeviceLocked(userDeviceMapping);
        if (lockStatus.isLocked) {
            return {
                success: false,
                message: lockStatus.message
            };
        }
    }

    // --------------------------------------------------
    // VERIFY OTP / LINK
    // --------------------------------------------------
    const validation = await verifyVerification(
        user._id,
        isOtpFlow ? deviceDoc._id : null,
        VerificationPurpose.DEVICE_VERIFICATION,
        code,
        contactMode
    );

    if (!validation.success) {

        if (isOtpFlow) {
            const failure = await handleFailedDeviceAttempt(userDeviceMapping);
            return {
                success: false,
                message: failure.message
            };
        }

        return {
            success: false,
            message: validation.message
        };
    }

    // --------------------------------------------------
    // SUCCESS POST-VERIFY
    // --------------------------------------------------
    if (isOtpFlow) {
        await resetDeviceAttempts(userDeviceMapping);
        await UserDeviceModel.updateOne(
            { _id: userDeviceMapping._id },
            { $set: { twoFactorVerifiedAt: new Date() } }
        );
    }

    logAuthEvent(
        user,
        device,
        AUTH_LOG_EVENTS.VERIFY_DEVICE,
        "Device verified via 2FA",
        null
    );

    logWithTime(
        `✅ Device (${device.deviceUUID}) verified for User (${user.userId})`
    );

    // --------------------------------------------------
    // LOGIN SESSION
    // --------------------------------------------------
    
    // Ensure device doc exists for policy check
    if (!deviceDoc) {
        deviceDoc = await DeviceModel.findOne({
            deviceUUID: device.deviceUUID
        }).lean();
    }

    // 🛡️ Login Policy Check
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
        device.deviceUUID
    );

    if (!refreshToken) {
        return {
            success: false,
            message: "Token generation failed due to internal error."
        }
    }

    const loginSuccess = await loginUserOnDevice(
        user,
        device,
        refreshToken,
        "Device Verification Completed (2FA)"
    );

    if (!loginSuccess) {
        return{
            success: false,
            message: "Login session creation failed due to internal error."
        }
    }

    return {
        success: true,
        autoLoggedIn: true
    };
};


module.exports = { verifyDeviceService };
