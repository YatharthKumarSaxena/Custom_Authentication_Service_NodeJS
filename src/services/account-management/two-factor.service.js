const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { IS_TWO_FA_FEATURE_ENABLED } = require("@configs/security.config");

/**
 * Common Service to Toggle 2FA Status
 * @param {Object} user - User document
 * @param {Object} device - Device document
 * @param {String} password - Plain text password
 * @param {Boolean} shouldEnable - true to enable, false to disable
 */
const toggleTwoFactorService = async (user, device, password, shouldEnable) => {
    
    // 1. Feature Flag Check (Safety)
    if (shouldEnable && !IS_TWO_FA_FEATURE_ENABLED) {
        throw new Error("2FA feature is currently disabled by system administrator.");
    }

    // 2. Password Verification (With Rate Limiter) 🛡️
    await verifyPasswordWithRateLimit(user, password);

    // 3. Optimization: Check if status is already same
    if (user.twoFactorEnabled === shouldEnable) {
        return { 
            success: true, 
            message: `Two-factor authentication is already ${shouldEnable ? 'enabled' : 'disabled'}.` 
        };
    }

    // 4. Update Status & Timestamps (✅ Added Logic)
    user.twoFactorEnabled = shouldEnable;

    if (shouldEnable) {
        // Case: ENABLING
        user.twoFactorEnabledAt = new Date();
        user.twoFactorDisabledAt = null; // Reset opposite field (Clean State)
    } else {
        // Case: DISABLING
        user.twoFactorDisabledAt = new Date();
        user.twoFactorEnabledAt = null;  // Reset opposite field (Clean State)
    }

    await user.save();

    // 5. Log Event
    const action = shouldEnable ? "ENABLED" : "DISABLED";
    logWithTime(`🔒 2FA ${action} for UserID: ${user.userId} from device: ${device.deviceUUID}`);
    
    logAuthEvent(
        user, 
        device, 
        shouldEnable ? AUTH_LOG_EVENTS.ENABLE_2FA : AUTH_LOG_EVENTS.DISABLE_2FA, 
        `User ${action.toLowerCase()} 2FA security.`,
        null
    );

    return {
        success: true,
        message: `Two-factor authentication has been successfully ${shouldEnable ? 'enabled' : 'disabled'}.`
    };
};

module.exports = { toggleTwoFactorService };