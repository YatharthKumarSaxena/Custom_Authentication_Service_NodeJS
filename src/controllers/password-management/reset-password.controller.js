const { resetPasswordService } = require("@services/password-management/reset-password.service");
const { 
    throwInternalServerError, 
    throwBadRequestError, 
    getLogIdentifiers 
} = require("@/responses/common/error-handler.response");
const { resetPasswordSuccessResponse } = require("@/responses/success/index");
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

        return resetPasswordSuccessResponse(res, user, device, result.isLoggedOut);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Reset Password Error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { resetPassword };