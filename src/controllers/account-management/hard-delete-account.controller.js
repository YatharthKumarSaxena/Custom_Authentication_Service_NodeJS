// Hard Delete Account Controller

const { 
    throwInvalidResourceError, 
    throwInternalServerError, 
    getLogIdentifiers, 
    throwTooManyRequestsError,
    throwSpecificInternalServerError
} = require("@/responses/common/error-handler.response");

const { hardDeleteAccountSuccessResponse } = require("@/responses/success/index");

const { logWithTime } = require("@utils/time-stamps.util");
const { hardDeleteAccountService } = require("@services/account-management/account-deletion.service");
const { logoutUserCompletely } = require("@services/auth/auth-session.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const hardDeleteMyAccount = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const { password } = req.body;
        const requestId = req.requestId;

        // Policy and admin checks are handled by middleware
        // Call service
        const result = await hardDeleteAccountService(user, device, password, requestId);

        if (!result.success) {

            if (result.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, result.message);
            }

            if (result.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwInvalidResourceError(res, "Password", result.message);
            }

            return throwSpecificInternalServerError(res, result.message);
        }

        // Best-effort logout
        const isLoggedOut = await logoutUserCompletely(
            user,
            device,
            requestId,
            "Account Hard Deletion"
        );

        if (isLoggedOut) {
            res.set("x-access-token", "");
        } else {
            logWithTime(
                `⚠️ Warning: Account deleted but logout failed for User ${user.userId}`
            );
        }

        // Response
        return hardDeleteAccountSuccessResponse(res, result.message);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Hard delete account error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { hardDeleteMyAccount };
