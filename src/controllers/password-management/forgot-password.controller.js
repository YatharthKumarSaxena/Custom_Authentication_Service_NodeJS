const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwConflictError, throwSpecificInternalServerError, getLogIdentifiers } = require("@/utils/error-handler.util");
const { OK } = require("@/configs/http-status.config");
const { forgotPasswordService } = require("@services/password-management/forgot-password.service");

const forgotPassword = async (req, res) => {
    try {
        const user = req.foundUser;
        const device = req.device;
        const requestId = req.requestId;

        const result = await forgotPasswordService(user, device, requestId);

        if (!result.success) {

            if (result.type === AuthErrorTypes.ALREADY_SENT) {
                return throwConflictError(res, result.message);
            }

            return throwSpecificInternalServerError(res, result.message);
        }

        const responses = [];
        if (result.email) responses.push("Email sent");
        if (result.phone) responses.push("SMS sent");

        logWithTime(`✅ Forgot password process initiated for User ${user.userId} via ${responses.join(" & ")}`);

        return res.status(OK).json({
            success: true,
            message: `Password reset initiated. ${responses.join(" & ")}.`
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error during forgot password for User ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = {
    forgotPassword
};