const { UserDeviceModel } = require("@models/user-device.model");
const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { VerificationPurpose, AuthErrorTypes } = require("@configs/enums.config");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { createToken } = require("@utils/issue-token.util");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { loginUserOnDevice } = require("../auth/auth-session.service");

// 👇 Rate Limiter Imports
const { 
    checkIsDeviceLocked, 
    handleFailedDeviceAttempt, 
    resetDeviceAttempts 
} = require("@utils/device-limiter.util");

const verifyDeviceService = async (req, res, code, contactMode) => {
    const user = req.user;
    const device = req.device;

    // 1️⃣ Fetch Mapping & Check Existence
    const userDeviceMapping = await UserDeviceModel.findOne({ 
        userId: user._id, 
        deviceId: device._id 
    });

    if (!userDeviceMapping) {
        throw { 
            type: AuthErrorTypes.INVALID_CREDENTIALS, 
            message: "Device session not found. Please login again." 
        };
    }

    // 2️⃣ Check Lock Status (Security Config Logic)
    const lockStatus = checkIsDeviceLocked(userDeviceMapping);
    if (lockStatus.isLocked) {
        throw { 
            type: AuthErrorTypes.LOCKED, 
            message: lockStatus.message 
        };
    }

    // 3️⃣ Validate OTP
    const validation = await verifyVerification(
        user._id, 
        VerificationPurpose.DEVICE_VERIFICATION, 
        code, 
        contactMode
    );

    // 4️⃣ Handle Failure (Increment Attempts)
    if (!validation.success) {
        const failureResult = await handleFailedDeviceAttempt(userDeviceMapping);
        
        if (failureResult.isLocked) {
            throw { 
                type: AuthErrorTypes.LOCKED, 
                message: failureResult.message 
            };
        } else {
            throw { 
                type: AuthErrorTypes.INVALID_PASSWORD, // or INVALID_OTP
                message: failureResult.message // e.g., "Invalid code. 1 attempt remaining."
            };
        }
    }

    // 5️⃣ Success Handler
    // A. Reset Failed Attempts
    await resetDeviceAttempts(userDeviceMapping);

    // B. Mark Device as Verified
    userDeviceMapping.twoFactorVerifiedAt = new Date();
    await userDeviceMapping.save();

    logAuthEvent(user, device, AUTH_LOG_EVENTS.VERIFY_DEVICE, `Device verified via 2FA/OTP.`, null);
    logWithTime(`✅ Device (${device.deviceUUID}) verified for User (${user.userId})`);

    // 6️⃣ Finalize Login (Generate Session)
    const refreshTokenString = createToken(user.userId, expiryTimeOfRefreshToken, device.deviceUUID);
    
    // Call session service to set cookies & update DB
    const loginSuccess = await loginUserOnDevice(req, res, refreshTokenString, "Device Verification Completed (2FA)");

    if (!loginSuccess) {
        throw new Error("Failed to finalize login session after device verification.");
    }

    return { 
        success: true, 
        autoLoggedIn: true 
    };
};

module.exports = { verifyDeviceService };