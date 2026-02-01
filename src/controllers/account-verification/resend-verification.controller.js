const { resendVerificationService } = require("@services/account-verification/resend-verification.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const {
    throwInternalServerError,
    throwTooManyRequestsError,
    throwBadRequestError,
    throwSpecificInternalServerError,
    throwConflictError
} = require("@/responses/common/error-handler.response");
const { resendVerificationSuccessReponse } = require("@/responses/success/index");

const resendVerification = async (req, res) => {
    try {
        const { purpose } = req.body;
        const user = req.foundUser;
        const device = req.device;
        const requestId = req.requestId;
        
        const result = await resendVerificationService(
            user,
            device,
            requestId,
            purpose
        );

        if (!result.success) {

            if (result.type === AuthErrorTypes.ALREADY_SENT) {
                return throwTooManyRequestsError(res, result.message);
            }

            if (result.type === AuthErrorTypes.INVALID_PURPOSE) {
                return throwBadRequestError(res, result.message);
            }

            if (result.type === AuthErrorTypes.ALREADY_VERIFIED) {
                return throwConflictError(res, result.message);
            }

            return throwSpecificInternalServerError(res, result.message);
        }

        return resendVerificationSuccessReponse(res,user,result);

    } catch (err) {
        return throwInternalServerError(res, err);
    }
};

module.exports = { resendVerification };
