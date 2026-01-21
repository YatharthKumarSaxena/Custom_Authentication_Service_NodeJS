// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { activateAccountService } = require("@services/account-management/account-activation.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { isAdminId } = require("@/utils/auth.util");

// Error Handlers
const { 
    throwInternalServerError, 
    throwTooManyRequestsError, 
    getLogIdentifiers,
    throwInvalidResourceError,
    throwConflictError,
    throwAccessDeniedError
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const activateMyAccount = async (req, res) => {
    try {
        const user = req.foundUser; // Middleware se mila user
        const device = req.device;  // Middleware se mila device
        const { password } = req.body;

        if(isAdminId(user.userId)){
            logWithTime(`❌ Activation Blocked: Attempt to activate Admin ${user.userId}.`);
            return throwAccessDeniedError(res,"Activation of Admin account is not permitted.");
        }

        // 1. Call Service
        const result = await activateAccountService(user, device, password);

        if (!result.success) {
            logWithTime(`❌ Account is already active for User ID: ${user.userId} - ${result.message}`);
            return throwConflictError(res, result.message);
        }

        // 2. Send Response
        return res.status(OK).json({
            success: true,
            message: result.message,
            suggestion: "Please login to continue."
        });

    } catch (err) {
        // ---------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------

        // 1. Invalid Password (400/422)
        if (err.type === AuthErrorTypes.INVALID_PASSWORD) {
            // Note: Hum InvalidResourceError bhi use kar sakte hain, ya Validation Error
            return throwInvalidResourceError(res, "Password");
        }

        // 2. User Locked (Rate Limit Hit)
        if (err.type === AuthErrorTypes.LOCKED) {
            return throwTooManyRequestsError(res, err.message);
        }

        // 3. Internal Server Error
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error while activating account ${getIdentifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { activateMyAccount };