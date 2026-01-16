const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError, throwBadRequestError, throwValidationError } = require("@utils/error-handler.util");
const { isValidRegex, validateLength } = require("@utils/validators-factory.util");
const { AuthModes, RequestLocation } = require("@configs/enums.config");

// ✅ Correct Imports
const { emailRegex, countryCodeRegex, localNumberRegex } = require("@configs/regex.config");
const { emailLength, countryCodeLength, localNumberLength } = require("@configs/fields-length.config");

const { createPhoneNumber } = require("@utils/auth.util");

/**
 * Factory function to validate Auth fields based on request location
 * @param {string} location - Request property to check (e.g., 'body', 'query', 'params')
 */

const createAuthValidator = (location = RequestLocation.BODY) => {
    return async (req, res, next) => {
        try {
            // STEP 0: CHECK IF LOCATION EXISTS
            if (!req[location]) {
                logMiddlewareError("authModeValidator", `Invalid request location: ${location}`, req);
                return throwInternalServerError(res, `Server Error: Cannot validate from ${location}`);
            }

            // STEP 1: EXTRACT DATA DYNAMICALLY
            let { email, phone, countryCode, localNumber } = req[location];

            let normalizedPhone = null;
            const validationErrors = [];

            // Email Validation
            if(email){
                if (!validateLength(email, emailLength.min, emailLength.max) || !isValidRegex(email, emailRegex)) {
                    validationErrors.push("Invalid Email format/length");
                }
            }

            // Phone Validation Logic
            if (phone) {
                // 1. Check Existence
                if(!countryCode || !localNumber) {
                    logMiddlewareError("authModeValidator", "Incomplete phone parts when phone is provided", req);
                    return throwBadRequestError(res, "Both countryCode and localNumber are required when phone is provided");
                }
                normalizedPhone = createPhoneNumber(countryCode, localNumber);
                // 2. Validate Normalized Phone
                if (normalizedPhone !== phone) {
                    logMiddlewareError("authModeValidator", "Phone does not match countryCode and localNumber", req);
                    return throwBadRequestError(res, "Provided phone does not match countryCode and localNumber");
                }
            }

            // Auto-Generate Phone (Mutation on Dynamic Location)
            if (!phone && countryCode && localNumber) {
                normalizedPhone = createPhoneNumber(countryCode, localNumber);
                
                // ⚠️ Important: Update the specific location (body/query), not always body
                req[location].phone = normalizedPhone;
                
                phone = normalizedPhone; 
            }

            // Validate Phone Parts
            if (normalizedPhone) {
                // 1. Validate Country Code
                const isCCValid = validateLength(countryCode, countryCodeLength.min, countryCodeLength.max) && 
                                  isValidRegex(countryCode, countryCodeRegex);
                
                if (!isCCValid) validationErrors.push("Invalid Country Code");

                // 2. Validate Local Number
                const isLNValid = validateLength(localNumber, localNumberLength.min, localNumberLength.max) && 
                                  isValidRegex(localNumber, localNumberRegex);
                
                if (!isLNValid) validationErrors.push("Invalid Local Number");
            }

            // STEP 2: AUTH MODE VALIDATION
            const authMode = process.env.AUTH_MODE;
            
            // CASE 1: EMAIL ONLY MODE
            if (authMode === AuthModes.EMAIL) {
                if (normalizedPhone) {
                    logMiddlewareError("authModeValidator", "Phone provided in EMAIL-only mode", req);
                    return throwBadRequestError(res, "Phone login is disabled. Please provide Email only.");
                }
                if (!email) return throwMissingFieldsError(res, "email");
            }
            
            // CASE 2: PHONE ONLY MODE
            else if (authMode === AuthModes.PHONE) {
                if (email) return throwBadRequestError(res, "Email login is disabled. Please provide Phone Number only.");
                if (!normalizedPhone) return throwMissingFieldsError(res, "countryCode and localNumber");
            }
            
            // CASE 3: BOTH REQUIRED
            else if (authMode === AuthModes.BOTH) {
                const missingFields = [];
                if (!email) missingFields.push("email");
                if (!normalizedPhone) missingFields.push("countryCode", "localNumber");

                if (missingFields.length > 0) {
                    return throwMissingFieldsError(res, missingFields.join(", "));
                }
            }
            
            // CASE 4: EITHER (Hybrid)
            else {
                if (!email && !normalizedPhone) return throwMissingFieldsError(res, "email OR (countryCode + localNumber)");
                if (email && normalizedPhone) return throwBadRequestError(res, "Provide either Email OR Phone, not both.");
            }
            
            // FINAL ERROR THROWING
            if (validationErrors.length > 0) {
                logMiddlewareError("authModeValidator", "Validation Failed", req);
                return throwValidationError(res, "Validation Failed", validationErrors.join(" | "));
            }

            return next();

        } catch (error) {
            logMiddlewareError("authModeValidator", "Internal error while validating auth elements", req);
            return throwInternalServerError(res, error);
        }
    };
};

module.exports = {
    createAuthValidator
};