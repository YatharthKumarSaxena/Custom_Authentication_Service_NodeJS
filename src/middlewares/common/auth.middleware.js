const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError, throwBadRequestError, throwValidationError } = require("@utils/error-handler.util");
const { isValidRegex, validateLength } = require("@utils/validators-factory.util")
const { AuthModes } = require("@configs/enums.config");
const { emailRegex, fullPhoneNumberRegex } = require("@configs/regex.config");
const { fullPhoneNumberLength, emailLength } = require("@configs/fields-length.config");

const authModeValidator = async (req, res, next) => {
    try {
        const { email, fullPhoneNumber } = req.body;
        const authMode = process.env.AUTH_MODE;

        let error = [];

        if (authMode === AuthModes.EMAIL) {
            // Step 1: Check if email field is provided
            if (!email) {
                logMiddlewareError("authModeValidator", "Missing email field", req);
                return throwMissingFieldsError(res, "email");
            }

            // Step 2: Validate email format + length
            if (!validateLength(email,emailLength.min,emailLength.max)) {
                error.push("Check Email Length");
                logMiddlewareError("authModeValidator", "Invalid email provided", req);
            }

            if (!isValidRegex(email, emailRegex)) {
                error.push("Check Email Format");
                logMiddlewareError("authModeValidator", "Invalid email format", req);
            }

            if(error.length > 0){
                return throwValidationError(res, "Invalid email provided", error.join(" | "));
            }

            // Remove Full Phone Number if Provided Additionally
            if (fullPhoneNumber) {
                delete req.body.fullPhoneNumber;
            }
        }

        else if (authMode === AuthModes.PHONE) {
            // Step 1: Check if fullPhoneNumber field is provided
            if (!fullPhoneNumber) {
                logMiddlewareError("authModeValidator", "Missing fullPhoneNumber field", req);
                return throwMissingFieldsError(res, "fullPhoneNumber");
            }

            // Step 2: Validate phone format + length
            if (!validateLength(fullPhoneNumber, fullPhoneNumberLength.min, fullPhoneNumberLength.max)) {
                error.push("Check fullPhoneNumber Length");
                logMiddlewareError("authModeValidator", "Invalid fullPhoneNumber provided", req);
            }

            if (!isValidRegex(fullPhoneNumber, fullPhoneNumberRegex)) {
                error.push("Check fullPhoneNumber Format");
                logMiddlewareError("authModeValidator", "Invalid fullPhoneNumber format", req);
            }

            if(error.length > 0){
                return throwValidationError(res, "Invalid fullPhoneNumber provided", error.join(" | "));
            }

            // Remove Email if Provided Additionally
            if (email) {
                delete req.body.email;
            }
        }

        else if (authMode === AuthModes.BOTH) {
            if(!email || !fullPhoneNumber){
                logMiddlewareError("authModeValidator", "Full Phone Number and Email are required fields", req);
                return throwMissingFieldsError(res, "email or fullPhoneNumber");
            }

            // Validate Email if Provided
            if(!validateLength(email,emailLength.min,emailLength.max) || !isValidRegex(email, emailRegex)){
                logMiddlewareError("authModeValidator", "Invalid email provided", req);
                error.push("Check Email Length/Format");
            }

            // Validate Phone if Provided
            if((!validateLength(fullPhoneNumber, fullPhoneNumberLength.min, fullPhoneNumberLength.max) || !isValidRegex(fullPhoneNumber, fullPhoneNumberRegex))){
                logMiddlewareError("authModeValidator", "Invalid fullPhoneNumber provided", req);
                error.push("Check fullPhoneNumber Length/Format");
            }

            if(error.length > 0){
                logMiddlewareError("authModeValidator", "Invalid Credentials provided", req);
                return throwValidationError(res, "Invalid Credentials", error.join(" | "));
            }
        }

        else{
            if(!email && !fullPhoneNumber){
                logMiddlewareError("authModeValidator", "Exactly one identifier (Email or Full Phone Number) is required", req);
                return throwMissingFieldsError(res, "email or fullPhoneNumber");
            }
            if(email && fullPhoneNumber){
                logMiddlewareError("authModeValidator", "Only one identifier (Email or Full Phone Number) should be provided", req);
                return throwBadRequestError(res, "Provide either email or fullPhoneNumber, not both.");
            }
            // Validate Email if Provided
            if(email && (!validateLength(email,emailLength.min,emailLength.max) || !isValidRegex(email, emailRegex))){
                logMiddlewareError("authModeValidator", "Invalid email provided", req);
                return throwValidationError(res, "Invalid email provided");
            }
            // Validate Phone if Provided
            if(fullPhoneNumber && (!validateLength(fullPhoneNumber, fullPhoneNumberLength.min, fullPhoneNumberLength.max) || !isValidRegex(fullPhoneNumber, fullPhoneNumberRegex))){
                logMiddlewareError("authModeValidator", "Invalid fullPhoneNumber provided", req);
                return throwValidationError(res, "Invalid fullPhoneNumber provided");
            }
        }

        return next();

    } catch (error) {
        logMiddlewareError("authModeValidator", "Internal error while validating auth elements", req);
        return throwInternalServerError(res, error);
    }
};

module.exports = {
    authModeValidator
};