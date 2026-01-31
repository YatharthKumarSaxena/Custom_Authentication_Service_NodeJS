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
        const requestId = req.requestId;

        if (isAdminId(user.userId)) {
            return throwAccessDeniedError(
                res,
                "Deactivation of Admin account is not permitted."
            );
        }

        // Call service
        const result = await deactivateAccountService(user, device, password, requestId);

        if (!result.success) {

            if (result.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, result.message);
            }

            if (result.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwInvalidResourceError(res, "Password", result.message);
            }

            if (result.type === AuthErrorTypes.ALREADY_DEACTIVATED) {
                return throwInvalidResourceError(res, "Account", result.message);
            }

            return throwInternalServerError(res, result.message);
        }

        // Best-effort logout
        const isLoggedOut = await logoutUserCompletely(
            user,
            device,
            requestId,
            "Account Deactivation"
        );

        if (isLoggedOut) {
            res.set("x-access-token", "");
        } else {
            logWithTime(
                `⚠️ Warning: Account deactivated but logout failed for User ${user.userId}`
            );
        }

        // Response
        return res.status(OK).json({
            success: true,
            message: result.message,
            notice: "You have been logged out."
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Deactivate account error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { deactivateMyAccount };