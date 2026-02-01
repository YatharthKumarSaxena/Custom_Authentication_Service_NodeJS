const { otp, authMode, verificationMode } = require("@configs/security.config");
const { AuthModes, VerifyMode } = require("@configs/enums.config");
const {
    throwValidationError,
    throwMissingFieldsError,
    logMiddlewareError,
    throwInternalServerError
} = require("@/responses/common/error-handler.response");

const { isValidRegex } = require("@utils/validators-factory.util");
const { logWithTime } = require("@utils/time-stamps.util");

const validateVerificationInput = (req, res, next) => {
    try {
        const { code } = req.body;

        const mustOTP =
            verificationMode === VerifyMode.OTP ||
            authMode !== AuthModes.EMAIL;
    
        // Missing Code
        
        if (!code) {
            const msg = mustOTP
                ? "OTP code is required."
                : "Verification token is required.";

            logMiddlewareError("validateVerificationInput", msg, req);
            return throwMissingFieldsError(res, "code");
        }
   
        // OTP validation
        
        if (mustOTP) {
            const otpRegex = new RegExp(`^[0-9]{${otp.length}}$`);

            if (!isValidRegex(code, otpRegex)) {
                logMiddlewareError(
                    "validateVerificationInput",
                    "Invalid OTP format",
                    req
                );
                return throwValidationError(
                    res,
                    `OTP must be a ${otp.length}-digit number.`
                );
            }
        }
        
        // LINK validation
        
        else {
            const tokenRegex = /^[0-9a-fA-F]{64}$/;

            if (!isValidRegex(code, tokenRegex)) {
                logMiddlewareError(
                    "validateVerificationInput",
                    "Invalid verification token format",
                    req
                );
                return throwValidationError(
                    res,
                    "Invalid verification token format."
                );
            }
        }

        logWithTime("✅ Verification input validated successfully");
        return next();

    } catch (error) {
        logMiddlewareError(
            "validateVerificationInput",
            "Internal error occurred",
            req
        );
        return throwInternalServerError(res, error);
    }
};

module.exports = { validateVerificationInput };