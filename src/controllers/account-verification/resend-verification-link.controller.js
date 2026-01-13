const { OK } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");
const { throwInternalServerError, throwBadRequestError } = require("@utils/error-handler.util");
const { resendVerificationService } = require("@services/account-verification/resend-verification.service");

const resendVerificationLink = async (req, res) => {
    try {
        const { purpose } = req.body;
        const user = req.foundUser;

        // ✅ Service Call (Logic abstracted)
        const success = await resendVerificationService(
            user, 
            req.deviceId, 
            purpose
        );

        if (success) {
            logWithTime(`✅ Resend verification successful for User ID: ${user.userId} in controller`);
            return res.status(OK).json({
                success: true,
                message: `Verification link/OTP for ${purpose} has been resent successfully.`,
            });
        } else {
            logWithTime(`❌ Resend verification failed for User ID: ${user.userId} in controller`);
            return throwInternalServerError(res, { message: `Failed to resend verification for ${purpose}. Please try again.` });
        }

    } catch (err) {
        logWithTime(`❌ Error in resendVerificationLink for userId: (${req.foundUser.userId})`);

        // Agar "Already exists" wala error hai jo service ne throw kiya
        if (err.message.includes("already exists")) {
            logWithTime(`⚠️ Resend verification link already sent recently for User ID: ${req.foundUser.userId}`);
            return throwBadRequestError(res, err.message);
        }

        return throwInternalServerError(res, err);
    }
}

module.exports = { resendVerificationLink };