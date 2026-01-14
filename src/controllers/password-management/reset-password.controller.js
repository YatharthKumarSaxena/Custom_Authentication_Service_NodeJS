const { OK } = require("@configs/http-status.config");
const { resetPasswordService } = require("@services/password-management/reset-password.service");
const { logoutUserCompletely } = require("@services/auth/auth-session.service");
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

        // 1. Validation
        if (!newPassword || !confirmPassword) {
            return throwBadRequestError(res, "Password fields are required.");
        }

        if (newPassword !== confirmPassword) {
            return throwBadRequestError(res, "New password and confirm password do not match.");
        }

        // 2. Call Service
        const result = await resetPasswordService(user, device, newPassword);

        // 3. Security: Global Logout (Force logout from all devices) 🛑
        try {
            // Password reset ke baad safety ke liye saare active sessions kill karna best hai
            await logoutUserCompletely(req, res, "Reset Password Force Logout");
        } catch (logoutErr) {
            logWithTime(`⚠️ Warning: Password reset but global logout failed for User ${user.userId}`);
            // Non-critical, process continues
        }

        if (!result.success) {
            logWithTime(`❌ Reset Password Service failed for User ${user.userId} from device ${device.deviceUUID}`);
            return throwBadRequestError(res, result.message);
        }

        logWithTime(`✅ Password reset successful for User ${user.userId} from device ${device.deviceUUID}`);
        
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