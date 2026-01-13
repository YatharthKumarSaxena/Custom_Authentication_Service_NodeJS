const { OK } = require("@configs/http-status.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwBadRequestError } = require("@utils/error-handler.util");
const { verifyEmailService } = require("@services/account-verification/verify-email.service");

const verifyEmail = async (req, res) => {
    try {
        const user = req.foundUser;
        const { token, type } = req.body; // 'type' yahan VerifyMode (OTP/LINK) hai

        // ✅ Service call: Ye verify karega aur DB update karega
        const success = await verifyEmailService(user, token, type);

        if (success) {
            logWithTime(`✅ Email verified for User ID: ${user._id}`);
            return res.status(OK).json({
                success: true,
                message: "Email verified successfully. Your account is now active."
            });
        }

        // Agar service false return kare (Validation failed)
        return throwBadRequestError(res, "Invalid or expired verification token.");

    } catch (err) {
        logWithTime(`❌ Error in verifyEmail controller for User ${req.foundUser?._id}: ${err.message}`);
        
        // Handle specific error messages from service
        if (err.message.includes("expired") || err.message.includes("invalid")) {
            return throwBadRequestError(res, err.message);
        }

        return throwInternalServerError(res, err);
    }
}

module.exports = { verifyEmail };