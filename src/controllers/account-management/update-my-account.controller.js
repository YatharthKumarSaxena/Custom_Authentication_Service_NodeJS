// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { updateAccountService } = require("@services/account-management/update-account.service");
const { AuthErrorTypes } = require("@configs/enums.config");

// Error Handlers
const { 
    throwInternalServerError, 
    throwBadRequestError, 
    throwInvalidResourceError, 
    throwConflictError, // Resource Exists ke liye (409)
    getLogIdentifiers
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { logoutUserCompletely } = require("@/services/auth/auth-session.service");

const updateMyAccount = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        
        // Data Extraction
        const updatePayload = {
            firstName: req.body.firstName,
            email: req.body.email,           // Standardize to 'email'
            countryCode: req.body.countryCode,
            localNumber: req.body.localNumber
        };

        // 1. Service Call
        const result = await updateAccountService(user, device, updatePayload);

        logWithTime(`✅ Update My Account successful for User ${user.userId}`);
        // 2. No Changes Case
        if (!result.success) {
            return res.status(OK).json({
                success: true,
                message: result.message
            });
        }

        if(result.updatedFields.includes("email") || result.updatedFields.includes("localNumber") || result.updatedFields.includes("countryCode")) {
            logWithTime(`✉️ User ${user.userId} updated their email or phone number. Verification may be required.`);
            try{
                await logoutUserCompletely(user, device, "Account Update: Email/Phone Change");
                res.set('x-access-token', '');
            }catch(err){
                logWithTime(`⚠️ Warning: User ${user.userId} updated email/phone but logout failed.`);
            }
        }
        // 3. Success Response
        return res.status(OK).json({
            success: true,
            message: result.message,
            updatedFields: result.updatedFields
        });

    } catch (err) {
        // ---------------------------------------------------------
        // ERROR HANDLING
        // ---------------------------------------------------------
        
        // 1. Validation Errors (Length, Regex)
        if (err.type === AuthErrorTypes.INVALID_INPUT) {
            logWithTime(`❌ Update failed due to invalid input for User ${req.user.userId}: ${err.message}`);
            return throwInvalidResourceError(res, "Input Validation", err.message);
        }

        // 2. Duplicate Data (Email/Phone already taken)
        if (err.type === AuthErrorTypes.RESOURCE_EXISTS) {
            logWithTime(`❌ Update failed due to existing resource for User ${req.user.userId}: ${err.message}`);
            return throwConflictError ? throwConflictError(res, err.message) : throwBadRequestError(res, err.message);
        }

        // 3. Internal Errors
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error while updating profile ${getIdentifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { updateMyAccount };