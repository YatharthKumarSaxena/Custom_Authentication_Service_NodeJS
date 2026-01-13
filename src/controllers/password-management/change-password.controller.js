const { verifyPasswordWithRateLimit } = require("@/services/password-management/password-verification.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { OK } = require("@configs/http-status.config");
const { logoutUserCompletely } = require("@/services/auth/auth-session.service");
const { logAuthEvent } = require("@/utils/auth-log-util");
const { throwBadRequestError, throwInvalidResourceError, throwInternalServerError, getLogIdentifiers, throwSpecificInternalServerError, throwTooManyRequestsError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { updatePassword } = require("@services/password-management/change-password.service");

const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const { newPassword, confirmPassword, password } = req.body;

        // 1. Validation: Confirm Password Check
        if (newPassword !== confirmPassword) {
            logWithTime(`❌ Confirm Password does not match with New Password for User ${getLogIdentifiers(req)}`);
            return throwBadRequestError(res, "Confirm Password does not match with New Password");
        }

        // 2. Service Call: Verify Old Password
        try {
            await verifyPasswordWithRateLimit(user, password);
        } catch (error) {
            // Handle specific verification errors
            if (error.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, error.message);
            }
            if (error.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwInvalidResourceError(res, "Password", error.message);
            }
            // Unknown errors go to main catch
            throw error;
        }

        // 3. Service Call: Update Password (User's Preferred Method: return false) 🔥
        const isUpdated = await updatePassword(user, newPassword);

        if (!isUpdated) {
            logWithTime(`❌ Password Update Service failed for User ${getLogIdentifiers(req)}`);
            return throwSpecificInternalServerError(res, "Failed to update password. Please try again.");
        }

        // 4. Service Call: Logout from all devices
        const isUserLoggedOut = await logoutUserCompletely(user, req, res, "log out from all device request due to Password Change");

        // 5. Logging & Response
        logWithTime(`✅ User Password with userId: (${user.userId}) is changed Succesfully from device id: (${req.deviceId})`);
        
        logAuthEvent(req, AUTH_LOG_EVENTS.CHANGE_PASSWORD,
            `User changed their password. Previous retry attempts reset.`, null);

        if (!isUserLoggedOut) {
            return res.status(OK).json({
                success: true,
                message: "Password updated successfully. However, logout from all devices failed. Please ensure to log out from other sessions manually."
            });
        }

        return res.status(OK).json({
            success: true,
            message: "Your password has been changed successfully. You have been logged out from all devices. Please log in again with your new password."
        });

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while changing the password of User ${getIdentifiers}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    changePassword
}