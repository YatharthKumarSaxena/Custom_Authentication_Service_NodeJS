const { verifyResetPasswordService } = require("@services/password-management/verify-reset-password.service");
const { 
    throwInternalServerError, 
    throwBadRequestError, 
    getLogIdentifiers 
} = require("@/responses/common/error-handler.response");
const { logWithTime } = require("@utils/time-stamps.util");
const { OK } = require("@/configs/http-status.config");

const verifyResetPassword = async (req, res) => {
    try {
        // req.foundUser comes from auth middleware (user is authenticated)
        const user = req.foundUser;
        const device = req.device;
        const { code } = req.body;  // Get OTP/Link code
        const requestId = req.requestId;

        // 1. Call Service to set resetPasswordEnabledAt
        const result = await verifyResetPasswordService(user, device, code, requestId);

        if (!result.success) {
            logWithTime(`❌ Verify Reset Password Service failed for User ${user.userId}`);
            return throwBadRequestError(res, result.message);
        }

        logWithTime(`✅ Password reset verified for User ${user.userId}`);
        
        return res.status(OK).json({
            success: true,
            message: result.message,
            data: {
                userId: user.userId,
                resetVerified: true,
                nextStep: "RESET_PASSWORD_REQUIRED"
            }
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Verify Reset Password Error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { verifyResetPassword };
