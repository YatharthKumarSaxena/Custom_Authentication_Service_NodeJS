const { OK } = require("@configs/http-status.config");
const { activateAccountService } = require("@services/account-management/account-activation.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const { isAdminId } = require("@/utils/auth.util");

const {
    throwInternalServerError,
    throwTooManyRequestsError,
    throwInvalidResourceError,
    throwConflictError,
    throwAccessDeniedError,
    getLogIdentifiers
} = require("@utils/error-handler.util");

const { logWithTime } = require("@utils/time-stamps.util");

const activateMyAccount = async (req, res) => {
    try {
        const user = req.foundUser;
        const device = req.device;
        const { password } = req.body;

        // 🚫 Admin protection
        if (isAdminId(user.userId)) {
            logWithTime(`❌ Admin activation blocked: ${user.userId}`);
            return throwAccessDeniedError(res, "Admin accounts cannot be activated manually.");
        }

        const result = await activateAccountService(user, device, password);

        if (!result.success) {

            // 🔐 Rate limit / lock
            if (result.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, result.message);
            }

            // ❌ Invalid password
            if (result.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwInvalidResourceError(res, "Password", result.message);
            }

            // ⚠ Already active
            if (result.type === AuthErrorTypes.ALREADY_ACTIVE) {
                return throwConflictError(res, result.message);
            }

            return throwConflictError(res, result.message);
        }

        return res.status(OK).json({
            success: true,
            message: result.message,
            suggestion: "Please login to continue."
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Activate account error for ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { activateMyAccount };
