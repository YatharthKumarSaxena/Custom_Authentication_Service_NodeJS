// Extracting the required modules
const { 
    throwInvalidResourceError, 
    throwInternalServerError, 
    getLogIdentifiers, 
    throwTooManyRequestsError,
    throwAccessDeniedError, 
} = require("@utils/error-handler.util");

const { logWithTime } = require("@utils/time-stamps.util");
const { OK } = require("@configs/http-status.config");
const { deactivateAccountService } = require("@services/account-management/account-deactivation.service");
const { logoutUserCompletely } = require("@services/auth/auth-session.service");
const { AuthErrorTypes } = require("@configs/enums.config"); 
const { isAdminId } = require("@/utils/auth.util");

const deactivateMyAccount = async (req, res) => {
    try {
        const user = req.user; 
        const device = req.device;
        const { password } = req.body;

        if(isAdminId(user.userId)){
            logWithTime(`❌ Deactivation Blocked: Attempt to deactivate Super Admin ${user.userId}.`);
            return throwAccessDeniedError(res,"Deactivation of Admin account is not permitted.");
        }

        // ---------------------------------------------------------
        // 1. CRITICAL: DB Update (Deactivate)
        // ---------------------------------------------------------
        await deactivateAccountService(user, device, password);

        // ---------------------------------------------------------
        // 2. NON-CRITICAL: Logout (Best Effort)
        // ---------------------------------------------------------
        try {
            await logoutUserCompletely(user, device, "Account Deactivation Request");
            res.set('x-access-token', '');
        } catch (logoutError) {
            logWithTime(`⚠️ Warning: Account deactivated but logout failed for User ${user.userId} from device ${device.deviceUUID}`);
        }

        // ---------------------------------------------------------
        // 3. SUCCESS RESPONSE
        // ---------------------------------------------------------
        logWithTime(`✅ Account deactivation process completed for User ${user.userId} from device ${device.deviceUUID}`);
        
        return res.status(OK).json({
            success: true,
            message: "Account deactivated successfully.",
            notice: "You have been logged out."
        });

    } catch (err) {
        // 🔥 ERROR HANDLING FIXED
        
        // 1. Locked (Rate Limit) Check ✅
        if (err.type === AuthErrorTypes.LOCKED) {
            logWithTime(`❌ Deactivation blocked: User ${req.user.userId} is locked due to too many failed attempts.`);
            // Agar aapke paas 'throwTooManyRequestsError' nahi hai to 'throwBadRequestError' use karein
            return throwTooManyRequestsError(res, err.message);
        }

        // 2. Invalid Password Check
        if (err.type === AuthErrorTypes.INVALID_PASSWORD) {
            logWithTime(`❌ Deactivation failed due to invalid password for User ${req.user.userId} from device ${req.device.deviceUUID}`);
            return throwInvalidResourceError(res, "Password", err.message);
        }

        // 3. Internal Server Error
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error while deactivating account ${getIdentifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { deactivateMyAccount };