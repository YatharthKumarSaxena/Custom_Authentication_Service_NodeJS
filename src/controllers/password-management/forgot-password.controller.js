const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwConflictError, throwSpecificInternalServerError, getLogIdentifiers } = require("@/responses/common/error-handler.response");
const { forgotPasswordSuccessResponse } = require("@/responses/success/index");
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

        return forgotPasswordSuccessResponse(res, user, result);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error during forgot password for User ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = {
    forgotPassword
};