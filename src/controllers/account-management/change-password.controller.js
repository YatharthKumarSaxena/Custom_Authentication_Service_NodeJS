const { verifyPasswordWithRateLimit } = require("@/services/password-management/password-verification.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { OK } = require("@configs/http-status.config");
const { logoutUserCompletely } = require("@/services/auth/auth-session.service");
const { logAuthEvent } = require("@/utils/auth-log-util");
const { 
    throwBadRequestError, 
    throwInvalidResourceError, 
    throwInternalServerError, 
    getLogIdentifiers, 
    throwSpecificInternalServerError, 
    throwTooManyRequestsError 
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { updatePassword } = require("@/services/account-management/change-password.service");
const { SecurityContext } = require("@/configs/security.config");

const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device; // Middleware se lo
        const { newPassword, confirmPassword, password } = req.body;

        // ---------------------------------------------------------
        // 1. Validation
        // ---------------------------------------------------------
        if (newPassword !== confirmPassword) {
            logWithTime(`❌ Change Password failed due to mismatched new and confirm passwords for User ${user.userId}`);
            return throwBadRequestError(res, "Confirm Password does not match with New Password");
        }

        // ---------------------------------------------------------
        // 2. Verify Old Password (with Rate Limit)
        // ---------------------------------------------------------
        try {
            await verifyPasswordWithRateLimit(user, password, SecurityContext.CHANGE_PASSWORD);
        } catch (error) {
            if (error.type === AuthErrorTypes.LOCKED){
                logWithTime(`❌ Change Password locked due to too many failed attempts for User ${user.userId}`);
                return throwTooManyRequestsError(res, error.message);
            } 
            if (error.type === AuthErrorTypes.INVALID_PASSWORD){
                logWithTime(`❌ Change Password failed due to invalid current password for User ${user.userId}`);
                return throwInvalidResourceError(res, "Password", error.message);
            }
            throw error; // Internal errors bubble up
        }

        // ---------------------------------------------------------
        // 3. Update Password (CRITICAL)
        // ---------------------------------------------------------
        const isUpdated = await updatePassword(user, newPassword);

        if (!isUpdated) {
            logWithTime(`❌ Password Update Service failed for User ${user.userId}`);
            return throwSpecificInternalServerError(res, "Failed to update password. Please try again.");
        }

        // ---------------------------------------------------------
        // 4. Force Logout (NON-CRITICAL / FAIL-SAFE)
        // ---------------------------------------------------------
        // Password change ho gaya hai, agar logout fail bhi hua to bhi success hi return karenge
        let logoutStatusMsg = "You have been logged out from all devices.";
        
        try {
            // Note: logoutUserCompletely(req, res, context) standard signature use karo
            await logoutUserCompletely(user, device, "Password Change Request");
            res.set('x-access-token', '');
        } catch (logoutError) {
            logWithTime(`⚠️ Warning: Password changed but logout failed for User ${user.userId}`);
            logoutStatusMsg = "Password changed, but automatic logout failed. Please logout manually.";
            // Error swallow kar lo
        }

        // ---------------------------------------------------------
        // 5. Response & Logs
        // ---------------------------------------------------------
        logWithTime(`✅ Password changed for User (${user.userId}) from device (${device.deviceUUID})`);
        
        logAuthEvent(user, device, AUTH_LOG_EVENTS.CHANGE_PASSWORD, `User changed password.`, null);

        return res.status(OK).json({
            success: true,
            message: "Password changed successfully.",
            notice: logoutStatusMsg
        });

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error while changing password for ${getIdentifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { changePassword };