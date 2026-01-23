const { OK } = require("@configs/http-status.config");
const { toggleTwoFactorService } = require("@services/account-management/two-factor.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const {
    throwInternalServerError,
    throwInvalidResourceError,
    throwTooManyRequestsError,
    throwBadRequestError,
    throwAccessDeniedError,
    getLogIdentifiers
} = require("@utils/error-handler.util");

const { logWithTime } = require("@utils/time-stamps.util");
const { isAdminId } = require("@/utils/auth.util");

const handleTwoFactorToggle = async (req, res, shouldEnable) => {
    try {
        const user = req.user;
        const device = req.device;
        const { password } = req.body;

        // 🚫 Admin protection
        if (isAdminId(user.userId)) {
            return throwAccessDeniedError(
                res,
                "Modifications to Super Admin 2FA are not allowed."
            );
        }

        // ✅ Call service
        const result = await toggleTwoFactorService(
            user,
            device,
            password,
            shouldEnable
        );

        // ❌ Business failures handled HERE
        if (!result.success) {

            if (result.type === AuthErrorTypes.LOCKED) {
                return throwTooManyRequestsError(res, result.message);
            }

            if (result.type === AuthErrorTypes.INVALID_PASSWORD) {
                return throwInvalidResourceError(
                    res,
                    "Password",
                    result.message
                );
            }

            return throwBadRequestError(res, result.message);
        }

        // ✅ Success
        return res.status(OK).json({
            success: true,
            message: result.message
        });

    } catch (err) {
        // 🚨 Only unexpected errors
        const identifiers = getLogIdentifiers(req);
        const action = shouldEnable ? "enable" : "disable";

        logWithTime(
            `❌ Internal error while trying to ${action} 2FA for ${identifiers}: ${err.message}`
        );

        return throwInternalServerError(res, err);
    }
};

const enable2FA = (req, res) =>
    handleTwoFactorToggle(req, res, true);

const disable2FA = (req, res) =>
    handleTwoFactorToggle(req, res, false);

module.exports = {
    enable2FA,
    disable2FA
};