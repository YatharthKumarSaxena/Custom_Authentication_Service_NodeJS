const { OK } = require("@configs/http-status.config");
const { resetPasswordService } = require("@services/password-management/reset-password.service");
const { 
    throwInternalServerError, 
    throwBadRequestError, 
    getLogIdentifiers 
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const resetPassword = async (req, res) => {
    try {
        // req.user typically comes from OTP verification middleware
        const user = req.foundUser; 
        const device = req.device;
        const { newPassword, confirmPassword } = req.body;
        const requestId = req.requestId;

        // 1. Validation
        if (!newPassword || !confirmPassword) {
            return throwBadRequestError(res, "Password fields are required.");
        }

        if (newPassword !== confirmPassword) {
            return throwBadRequestError(res, "New password and confirm password do not match.");
        }

        // 2. Call Service
        const result = await resetPasswordService(user, device, newPassword, requestId);

        if (!result.success) {
            logWithTime(`❌ Reset Password Service failed for User ${user.userId} from device ${device.deviceUUID}`);
            return throwBadRequestError(res, result.message);
        }

        logWithTime(`✅ Password reset successful for User ${user.userId} from device ${device.deviceUUID}`);
        
        if (!result.isLoggedOut) {
            return res.status(OK).json({
                success: true,
                message: result.message,
                notice: "Warning: Unable to log out all active sessions. Please verify your account security."
            });
        }
        
        // 4. Response
        return res.status(OK).json({
            success: true,
            message: result.message,
            notice: "All active sessions have been terminated. Please login with your new password."
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Reset Password Error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { resetPassword };