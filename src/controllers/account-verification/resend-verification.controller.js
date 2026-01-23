const { OK } = require("@configs/http-status.config");
const { resendVerificationService } = require("@services/account-verification/resend-verification.service");
const { AuthErrorTypes } = require("@configs/enums.config");

const {
    throwInternalServerError,
    throwTooManyRequestsError,
    throwBadRequestError
} = require("@utils/error-handler.util");

const { logWithTime } = require("@utils/time-stamps.util");

const resendVerification = async (req, res) => {
    try {
        const { purpose } = req.body;
        const user = req.foundUser;
        const device = req.device;

        const result = await resendVerificationService(
            user,
            device,
            purpose
        );

        if (!result.success) {

            if (result.type === AuthErrorTypes.ALREADY_SENT) {
                return throwTooManyRequestsError(res, result.message);
            }

            if (result.type === AuthErrorTypes.INVALID_PURPOSE) {
                return throwBadRequestError(res, result.message);
            }

            return throwInternalServerError(res, result.message);
        }

        logWithTime(
            `✅ Verification resent for User ${user.userId} via ${result.contactMode}`
        );

        return res.status(OK).json({
            success: true,
            message: `Verification ${result.type === "OTP" ? "code" : "link"} has been resent successfully.`
        });

    } catch (err) {
        return throwInternalServerError(res, err);
    }
};

module.exports = { resendVerification };
