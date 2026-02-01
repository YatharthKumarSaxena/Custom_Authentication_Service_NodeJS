const { updateAccountService } = require("@services/account-management/update-account.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const {
    throwInternalServerError,
    throwInvalidResourceError,
    throwConflictError
} = require("@/responses/common/error-handler.response");

const { updateAccountNoChangeResponse, updateAccountSuccessResponse } = require("@/responses/success/index");

const { logWithTime } = require("@utils/time-stamps.util");
const { logoutUserCompletely } = require("@/services/auth/auth-session.service");

const updateMyAccount = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const requestId = req.requestId;

        const updatePayload = {
            firstName: req.body.firstName,
            email: req.body.email,
            countryCode: req.body.countryCode,
            localNumber: req.body.localNumber
        };

        // Call service
        const result = await updateAccountService(
            user,
            device,
            requestId,
            updatePayload
        );

        // Business failure handling
        if (!result.success) {

            // Validation errors
            if (result.type === AuthErrorTypes.INVALID_INPUT) {
                return throwInvalidResourceError(
                    res,
                    "Input",
                    result.message
                );
            }

            // Email / Phone already exists
            if (result.type === AuthErrorTypes.RESOURCE_EXISTS) {
                return throwConflictError(res, result.message);
            }

            // No change is NOT an error
            return updateAccountNoChangeResponse(res, result.message);
        }

        // Logout if sensitive info changed
        const sensitiveFieldsChanged =
            result.updatedFields.includes("Email") ||
            result.updatedFields.includes("Phone Number");

        if (sensitiveFieldsChanged) {
            logWithTime(
                `🔐 Sensitive account data changed for User ${user.userId}. Logging out all sessions.`
            );

            const isLoggedOut = await logoutUserCompletely(
                user,
                device,
                requestId,
                "Account Update: Email/Phone Change"
            );

            if (isLoggedOut) {
                res.set("x-access-token", "");
            } else {
                logWithTime(
                    `⚠️ Logout failed after sensitive update for User ${user.userId}`
                );
            }
        }

        // Success response with verification status
        return updateAccountSuccessResponse(res, result);

    } catch (err) {
        logWithTime(`❌ Fatal update account error: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { updateMyAccount };
