const { otp, authMode, verificationMode } = require("@configs/security.config");
const { AuthModes, VerifyMode } = require("@configs/enums.config");
const {
    throwValidationError, 
    throwMissingFieldsError, 
    logMiddlewareError,
    throwInternalServerError,
    throwAccessDeniedError
} = require("@utils/error-handler.util");
const { isValidRegex } = require("@utils/validators-factory.util");

const validateVerificationInput = (req, res, next) => {
    const { otp: inputOtp, token: inputToken } = req.body;

    const otpRegex = new RegExp(`^[0-9]{${otp.length}}$`);
    const tokenRegex = /^[0-9a-fA-F]{64}$/;

    try {
        if (inputOtp && inputToken) {
            logMiddlewareError("validateVerificationInput", "Both OTP and Token provided", req);
            return throwAccessDeniedError(res, "Invalid request. Provide either OTP or Token, not both.");
        }
        // CASE 1: PHONE Auth
        if (authMode !== AuthModes.EMAIL) {
            // Check 1: Missing Field
            if (!inputOtp) {
                logMiddlewareError("validateVerificationInput", "Missing OTP for Phone Verification", req);
                return throwMissingFieldsError(res, "otp");
            }
            // Check 2: Validation (Regex/Length)
            if (!isValidRegex(inputOtp, otpRegex)) {
                logMiddlewareError("validateVerificationInput", "Invalid OTP Format for Phone Verification", req);
                return throwValidationError(res, `OTP must be a ${otp.length}-digit number.`);
            }
            return next();
        }

        // CASE 2: EMAIL Auth

        // Sub-case A: Verify via OTP
        if (verificationMode === VerifyMode.OTP) {
            if (!inputOtp) {
                logMiddlewareError("validateVerificationInput", "Missing OTP for Email Verification", req);
                return throwMissingFieldsError(res, "otp");
            }
            if (!isValidRegex(inputOtp, otpRegex)) {
                logMiddlewareError("validateVerificationInput", "Invalid OTP Format for Email Verification", req);
                return throwValidationError(res, `OTP must be a ${otp.length}-digit number.`);
            }
            return next();
        }

        // Sub-case B: Verify via Link (Token)
        if (verificationMode === VerifyMode.LINK) {
            if (!inputToken) {
                logMiddlewareError("validateVerificationInput", "Missing Token for Email Verification", req);
                return throwMissingFieldsError(res, "token");
            }
            if (!isValidRegex(inputToken, tokenRegex)) {
                logMiddlewareError("validateVerificationInput", "Invalid Token Format for Email Verification", req);
                return throwValidationError(res, "Invalid verification token format.");
            }
            return next();
        }

        logMiddlewareError("validateVerificationInput", "Configuration Error: Unknown Verify Mode", req);
        return throwInternalServerError(res, "Server Configuration Error");

    } catch (error) {
        logMiddlewareError("validateVerificationInput", "Internal Error Occurred", req);
        return throwInternalServerError(res, error);
    }
};

module.exports = { validateVerificationInput };