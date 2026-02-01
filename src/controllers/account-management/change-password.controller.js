const { verifyPasswordWithRateLimit } = require("@services/password-management/password-verification.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { logoutUserCompletely } = require("@services/auth/auth-session.service");
const {
    throwBadRequestError,
    throwInvalidResourceError,
    throwInternalServerError,
    getLogIdentifiers,
    throwSpecificInternalServerError,
    throwTooManyRequestsError
} = require("@/responses/common/error-handler.response");
const { changePasswordSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");
const { updatePassword } = require("@/services/account-management/change-password.service");
const { SecurityContext } = require("@/configs/security.config");

const changePassword = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device; // Middleware se lo
        const requestId = req.requestId;
        const { newPassword, confirmPassword, password } = req.body;
    
        // 1. Validation
        
        if (newPassword !== confirmPassword) {
            logWithTime(`❌ Change Password failed due to mismatched new and confirm passwords for User ${user.userId}`);
            return throwBadRequestError(res, "Confirm Password does not match with New Password");
        }

        // 2. Verify Old Password (with Rate Limit)
        
        const passwordVerification = await verifyPasswordWithRateLimit(user, password, SecurityContext.CHANGE_PASSWORD);
        
        if (!passwordVerification.success) {

            if (passwordVerification.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, passwordVerification.message);
            }

            if (passwordVerification.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwInvalidResourceError(
                    res,
                    "Password",
                    passwordVerification.message
                );
            }
        }

        if (password === newPassword) {
            logWithTime(`❌ Change Password failed because new password is same as old password for User ${user.userId}`);
            return throwBadRequestError(res, "New Password cannot be same as Old Password");
        }
        
        // 3. Update Password (CRITICAL)
        
        const isUpdated = await updatePassword(user, newPassword, device, requestId, "Change Password");

        if (!isUpdated) {
            logWithTime(`❌ Password Update Service failed for User ${user.userId}`);
            return throwSpecificInternalServerError(res, "Failed to update password. Please try again.");
        }
 
        // 4. Force Logout (NON-CRITICAL / FAIL-SAFE)
        
        // Password change ho gaya hai, agar logout fail bhi hua to bhi success hi return karenge
        let logoutStatusMsg = "You have been logged out from all devices.";

        const isLoggedOut = await logoutUserCompletely(user, device, requestId, "Password Change Request");
            
        if(!isLoggedOut) {
            logWithTime(`⚠️ Warning: Password changed but logout failed for User ${user.userId}`);
            logoutStatusMsg = "Password changed, but automatic logout failed. Please logout manually."
        }

        res.set('x-access-token', '');
        
        // 5. Response & Logs
        
        return changePasswordSuccessResponse(res, user, device, logoutStatusMsg);

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error while changing password for ${getIdentifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { changePassword };