const { verifyPasswordWithRateLimit } = require("@/services/auth-security.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { OK } = require("@configs/http-status.config");
const { logoutUserCompletely } = require("@/services/auth-session.service");
const { hashPassword } = require("@/utils/auth.util");
const { logAuthEvent } = require("@/utils/auth-log-util");
const { throwBadRequestError, throwInvalidResourceError, throwInternalServerError, getLogIdentifiers, throwSpecificInternalServerError, throwTooManyRequestsError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");

const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const { newPassword, confirmPassword, password } = req.body;
        try {
            await verifyPasswordWithRateLimit(user, password);
        } catch (error) {
            
            // Case 1: Account Locked (429 Too Many Requests)
            if (error.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, error.message);
            }
            
            // Case 2: Wrong Password (401 Unauthorized)
            if (error.type === AuthErrorTypes.INVALID_PASSWORD) {
                // Aapka existing util use kar rahe hain:
                // throwInvalidResourceError(res, resourceName, reasonMessage)
                return throwInvalidResourceError(res, "Password", error.message);
            }

            // Case 3: Unknown Error (re-throw to main catch block)
            errorMessage(error);
            return throwSpecificInternalServerError(res, "An unexpected error occurred during password verification.");
        }
        if (newPassword !== confirmPassword) {
            logWithTime(`❌ Confirm Password does not match with New Password for User ${getLogIdentifiers(req)}`);
            return throwBadRequestError(res, "Confirm Password does not match with New Password");
        }
        const hashedPassword = await hashPassword(newPassword);
        if (!hashedPassword) {
            logWithTime(`❌ Password Hashing failed for User ${getLogIdentifiers(req)}`);
            return throwSpecificInternalServerError(res, "Password Hashing Failed");
        }
        user.password = hashedPassword;
        user.passwordChangedAt = Date.now();
        await user.save();
        const isUserLoggedOut = await logoutUserCompletely(user, req, res, "log out from all device request due to Password Change");
        if (!isUserLoggedOut) {
            return res.status(OK).json({
                success: true,
                message: "Password updated successfully. However, logout from all devices failed. Please ensure to log out from other sessions manually."
            });
        }
        logWithTime(`✅ User Password with userId: (${user.userId}) is changed Succesfully from device id: (${req.deviceId})`);
        // Update data into auth.logs
        logAuthEvent(req, AUTH_LOG_EVENTS.CHANGE_PASSWORD,
            `User changed their password in the number of password attempts: ${user.security.passwordRetryAttempts}`, null);
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