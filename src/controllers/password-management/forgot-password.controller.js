const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwConflictError, throwSpecificInternalServerError } = require("@/utils/error-handler.util");
const { OK } = require("@/configs/http-status.config");
const { logAuthEvent } = require("@utils/auth-log-util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { forgotPasswordService } = require("@services/password-management/forgot-password.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const forgotPassword = async (req, res) => {
    try {
        const user = req.foundUser;
        const device = req.device;

        const result = await forgotPasswordService(user, device.deviceUUID);

        if (!result.success) {

            if (result.type === AuthErrorTypes.ALREADY_SENT) {
                return throwConflictError(res, result.message);
            }

            return throwSpecificInternalServerError(res, result.message);
        }

        logAuthEvent(
            user,
            device,
            AUTH_LOG_EVENTS.FORGOT_PASSWORD,
            `Forgot password requested via ${result.contactMode}`,
            null
        );

        const responses = [];
        if (result.email) responses.push("Email sent");
        if (result.phone) responses.push("SMS sent");

        logWithTime(`✅ Forgot password process initiated for User ${user.userId} via ${responses.join(" & ")}`);

        return res.status(OK).json({
            success: true,
            message: `Password reset initiated. ${responses.join(" & ")}.`
        });

    } catch (err) {
        return throwInternalServerError(res, err);
    }
};

module.exports = {
    forgotPassword
};