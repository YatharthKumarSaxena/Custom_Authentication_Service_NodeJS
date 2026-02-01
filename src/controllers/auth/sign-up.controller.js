const { signUpService } = require("@services/auth/sign-up.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const {
    throwInternalServerError,
    throwConflictError,
    throwSpecificInternalServerError,
    throwBadRequestError
} = require("@/responses/common/error-handler.response");

const { signUpSuccessResponse } = require("@/responses/success/index");

const { logWithTime } = require("@utils/time-stamps.util");

const signUp = async (req, res) => {
    try {
        const deviceInput = req.device;
        const userPayload = req.body;
        const requestId = req.requestId;

        // Call service
        const result = await signUpService(deviceInput, userPayload, requestId);

        // Business failures handled HERE
        if (!result.success) {

            if (result.type === AuthErrorTypes.RESOURCE_EXISTS) {
                return throwConflictError(res, result.message);
            }

            if (result.type === AuthErrorTypes.SERVER_LIMIT_REACHED) {
                return throwSpecificInternalServerError(res, result.message);
            }

            if (result.type === AuthErrorTypes.SERVER_ERROR) {
                return throwSpecificInternalServerError(res, result.message);
            }

            return throwBadRequestError(res, result.message);
        }

        // Success
        return signUpSuccessResponse(res, result, deviceInput);

    } catch (err) {
        // Only unexpected crashes
        logWithTime(`❌ Fatal SignUp Error: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { signUp };