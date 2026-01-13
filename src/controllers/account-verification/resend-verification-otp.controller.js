const { OK } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");
const { throwInternalServerError, throwBadRequestError } = require("@utils/error-handler.util");
const { resendVerificationService } = require("@services/password-management/resend-verification.service");

/**
 * 📱 Resend OTP Controller
 * Specifically handles cases where user wants an OTP resend
 */
const resendVerificationOTP = async (req, res) => {
    try {
        const { purpose } = req.body; // e.g., PHONE_VERIFICATION or DEVICE_VERIFICATION
        const user = req.foundUser;

        // ✅ Hum wahi universal service use karenge jo humne banayi thi
        // Ye service khud decide kar legi ki OTP bhejna hai ya Link (ContactMode ke basis pe)
        const success = await resendVerificationService(
            user, 
            req.deviceId, 
            purpose
        );

        if (success) {
            logWithTime(`✅ OTP Resend successful: User ${user._id} | Purpose: ${purpose}`);
            return res.status(OK).json({
                success: true,
                message: `Verification code (OTP) for ${purpose.toLowerCase().replace('_', ' ')} has been resent.`,
            });
        }

        return throwInternalServerError(res, { message: "Failed to resend OTP. Please try again." });

    } catch (err) {
        logWithTime(`❌ OTP Resend Error for User ${req.foundUser?._id}: ${err.message}`);

        // Rate limiting check (Already exists)
        if (err.message.includes("already exists")) {
            return throwBadRequestError(res, err.message);
        }

        return throwInternalServerError(res, err);
    }
}

module.exports = { 
    resendVerificationOTP 
};