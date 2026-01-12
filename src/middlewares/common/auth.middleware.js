const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError, throwBadRequestError, throwValidationError } = require("@utils/error-handler.util");
const { isValidRegex, validateLength } = require("@utils/validators-factory.util")
const { AuthModes } = require("@configs/enums.config");
const { emailRegex, phoneNumberRegex } = require("@configs/regex.config");
const { phoneNumberLength, emailLength } = require("@configs/fields-length.config");

const authModeValidator = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
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
            if (phone) {
                delete req.body.phone;
            }
        }

        else if (authMode === AuthModes.PHONE) {
            // Step 1: Check if phone field is provided
            if (!phone) {
                logMiddlewareError("authModeValidator", "Missing phone field", req);
                return throwMissingFieldsError(res, "phone");
            }

            // Step 2: Validate phone format + length
            if (!validateLength(phone, phoneNumberLength.min, phoneNumberLength.max)) {
                error.push("Check phone Length");
                logMiddlewareError("authModeValidator", "Invalid phone provided", req);
            }

            if (!isValidRegex(phone, phoneNumberRegex)) {
                error.push("Check phone Format");
                logMiddlewareError("authModeValidator", "Invalid phone format", req);
            }

            if(error.length > 0){
                return throwValidationError(res, "Invalid phone provided", error.join(" | "));
            }

            // Remove Email if Provided Additionally
            if (email) {
                delete req.body.email;
            }
        }

        else if (authMode === AuthModes.BOTH) {
            if(!email || !phone){
                logMiddlewareError("authModeValidator", "Full Phone Number and Email are required fields", req);
                return throwMissingFieldsError(res, "email or phone");
            }

            // Validate Email if Provided
            if(!validateLength(email,emailLength.min,emailLength.max) || !isValidRegex(email, emailRegex)){
                logMiddlewareError("authModeValidator", "Invalid email provided", req);
                error.push("Check Email Length/Format");
            }

            // Validate Phone if Provided
            if((!validateLength(phone, phoneNumberLength.min, phoneNumberLength.max) || !isValidRegex(phone, phoneNumberRegex))){
                logMiddlewareError("authModeValidator", "Invalid phone provided", req);
                error.push("Check phone Length/Format");
            }

            if(error.length > 0){
                logMiddlewareError("authModeValidator", "Invalid Credentials provided", req);
                return throwValidationError(res, "Invalid Credentials", error.join(" | "));
            }
        }

        else{
            if(!email && !phone){
                logMiddlewareError("authModeValidator", "Exactly one identifier (Email or Full Phone Number) is required", req);
                return throwMissingFieldsError(res, "email or phone");
            }
            if(email && phone){
                logMiddlewareError("authModeValidator", "Only one identifier (Email or Full Phone Number) should be provided", req);
                return throwBadRequestError(res, "Provide either email or phone, not both.");
            }
            // Validate Email if Provided
            if(email && (!validateLength(email,emailLength.min,emailLength.max) || !isValidRegex(email, emailRegex))){
                logMiddlewareError("authModeValidator", "Invalid email provided", req);
                return throwValidationError(res, "Invalid email provided");
            }
            // Validate Phone if Provided
            if(phone && (!validateLength(phone, phoneNumberLength.min, phoneNumberLength.max) || !isValidRegex(phone, phoneNumberRegex))){
                logMiddlewareError("authModeValidator", "Invalid phone provided", req);
                return throwValidationError(res, "Invalid phone provided");
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