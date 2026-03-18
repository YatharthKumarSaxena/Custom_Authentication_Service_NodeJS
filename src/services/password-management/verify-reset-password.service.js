const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { logAuthEvent } = require("@services/audit/auth-audit.service");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { verifyVerification } = require("@services/account-verification/verification-validator.service");
const { VerificationPurpose } = require("@configs/enums.config");
const { getUserContacts } = require("@utils/contact-selector.util");

/**
 * Service to verify OTP/token for reset password
 * 1. Validates OTP/Link against database
 * 2. Checks expiry, attempts, isUsed status
 * 3. Marks as used (prevents reuse)
 * 4. Only then sets resetPasswordEnabledAt for time-window validation
 */

const verifyResetPasswordService = async (user, device, code, requestId) => {
    try {
        // ===== STEP 1: VERIFY OTP/LINK (Critical Security Check) =====
        const { contactMode } = getUserContacts(user);

        // Ensure device document exists
        let deviceDoc = device;
        if (device._id) {
            deviceDoc = await DeviceModel.findById(device._id);
        } else {
            deviceDoc = await DeviceModel.findOne({ deviceUUID: device.deviceUUID });
        }

        const validation = await verifyVerification(
            user._id,
            deviceDoc._id,
            VerificationPurpose.FORGOT_PASSWORD,
            code,
            contactMode
        );

        // ❌ OTP/Link invalid, expired, already used, or max attempts reached
        if (!validation.success) {
            logWithTime(`⚠️ Password reset verification failed for ${user.userId}: ${validation.message}`);
            return {
                success: false,
                message: validation.message  // Returns specific error: "Invalid OTP", "Already used", etc.
            };
        }

        // ✅ OTP/Link verified successfully and marked as used in DB (atomic operation)
        // Now proceed with setting reset password window

        // ===== STEP 2: SET RESET PASSWORD WINDOW =====
        const updatedUser = await UserModel.findByIdAndUpdate(
            user._id,
            {
                resetPasswordEnabledAt: new Date()
            },
            {
                new: true,
                runValidators: false
            }
        );

        if (!updatedUser) {
            return {
                success: false,
                message: "Unable to update password reset status. Please try again."
            };
        }

        // ===== STEP 3: LOG EVENT =====
        logAuthEvent(
            user,
            deviceDoc,
            requestId,
            AUTH_LOG_EVENTS.VERIFY_DEVICE,
            `Password reset OTP verified - reset window enabled (10 min)`,
            null
        );

        logWithTime(`✅ Password reset OTP verified for User ${user.userId}. Reset window: 10 minutes`);

        return {
            success: true,
            message: "Verification successful. You can now reset your password within 10 minutes."
        };

    } catch (err) {
        logWithTime(`❌ Error in verifyResetPasswordService for user ${user.userId}: ${err.message}`);
        return {
            success: false,
            message: "Verification failed. Please try again."
        };
    }
};

module.exports = { verifyResetPasswordService };