const { UserDeviceModel, DeviceModel } = require("@models/index");
const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { VerificationPurpose, VerifyMode, AuthModes } = require("@configs/enums.config");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { createToken } = require("@utils/issue-token.util");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { loginUserOnDevice } = require("../auth/auth-session.service");
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
        });

        if (!deviceDoc) {
            return {
                success: false,
                message: "OTP must be verified from the same device."
            };
        }

        userDeviceMapping = await UserDeviceModel.findOne({
            userId: user._id,
            deviceId: deviceDoc._id
        });

        if (!userDeviceMapping) {
            return {
                success: false,
                message: "No verification code was issued for this device."
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
        userDeviceMapping.twoFactorVerifiedAt = new Date();
        await userDeviceMapping.save();
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
