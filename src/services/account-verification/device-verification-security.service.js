const { verificationSecurity } = require("@configs/security.config");
const { VerificationPurpose } = require("@configs/enums.config");
const { UserDeviceModel } = require("@models/user-device.model");

// Config se limit extract karo
const DEVICE_SECURITY_CONFIG = verificationSecurity[VerificationPurpose.DEVICE_VERIFICATION];
const MAX_DEVICE_ATTEMPTS = DEVICE_SECURITY_CONFIG.MAX_ATTEMPTS; // Value: 2 (from your config)

/**
 * Check if device is already locked
 */
const checkIsDeviceLocked = (userDevice) => {
    if (!userDevice) return { isLocked: false };

    if (userDevice.failed2FAAttempts >= MAX_DEVICE_ATTEMPTS) {
        return {
            isLocked: true,
            message: "Too many failed attempts. Device is locked. Please request a new code."
        };
    }
    return { isLocked: false };
};

/**
 * Increment failed attempts count
 */
const handleFailedDeviceAttempt = async (userDevice) => {
    if (!userDevice) return { isLocked: false, message: "Device not found" };


    // 1. Increment Count (Atomic)
    await UserDeviceModel.updateOne(
        { _id: userDevice._id },
        { $inc: { failed2FAAttempts: 1 } }
    );
    
    const newAttemptCount = userDevice.failed2FAAttempts + 1;

    // 2. Check Remaining
    const attemptsLeft = MAX_DEVICE_ATTEMPTS - newAttemptCount;

    // Agar limit cross ho gayi ya barabar ho gayi
    if (attemptsLeft <= 0) {
        return {
            isLocked: true,
            message: "Too many failed attempts. Device verification is locked. Request a new code."
        };
    }

    return {
        isLocked: false,
        message: `Invalid code. ${attemptsLeft} attempt(s) remaining.`
    };
};

/**
 * Reset attempts on success
 */
const resetDeviceAttempts = async (userDevice) => {
    if (userDevice && userDevice.failed2FAAttempts > 0) {
        await UserDeviceModel.updateOne(
            { _id: userDevice._id },
            { $set: { failed2FAAttempts: 0 } }
        );
    }
};

module.exports = { 
    checkIsDeviceLocked, 
    handleFailedDeviceAttempt, 
    resetDeviceAttempts 
};