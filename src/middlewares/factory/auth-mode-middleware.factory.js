const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError, throwBadRequestError, throwValidationError } = require("@/responses/common/error-handler.response");
const { isValidRegex, validateLength } = require("@utils/validators-factory.util");
const { AuthModes, RequestLocation } = require("@configs/enums.config");
const { authMode } = require("@configs/security.config");

// Correct Imports
const { emailRegex, countryCodeRegex, localNumberRegex } = require("@configs/regex.config");
const { emailLength, countryCodeLength, localNumberLength } = require("@configs/fields-length.config");

const { createPhoneNumber } = require("@utils/auth.util");
const { logWithTime } = require("@/utils/time-stamps.util");

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
                return throwBadRequestError(res, `Empty request ${location}`);
            }

            // STEP 1: EXTRACT DATA DYNAMICALLY
            const { email, countryCode, localNumber } = req[location];
            
            let missingFields = [];
            const validationErrors = [];

            // CASE 1: EMAIL ONLY MODE
            if (authMode === AuthModes.EMAIL) {
                if (!email){
                    logMiddlewareError("authModeValidator", "Email is required in EMAIL auth mode", req);
                    return throwMissingFieldsError(res, "email");
                }
            }
            
            // CASE 2: PHONE ONLY MODE
            else if (authMode === AuthModes.PHONE) {
                if (!countryCode) {
                    missingFields.push("countryCode");
                }
                if (!localNumber) {
                    missingFields.push("localNumber");
                }
                if (missingFields.length > 0) {
                    logMiddlewareError("authModeValidator", "Missing fields in PHONE auth mode", req);
                    return throwMissingFieldsError(res, missingFields.join(", "));
                }
            }
            
            // CASE 3: BOTH REQUIRED
            else if (authMode === AuthModes.BOTH) {
                const missingFields = [];
                if (!email) missingFields.push("email");
                if (!countryCode) missingFields.push("countryCode");
                if (!localNumber) missingFields.push("localNumber");

                if (missingFields.length > 0) {
                    logMiddlewareError("authModeValidator", "Missing fields in BOTH auth mode", req);
                    return throwMissingFieldsError(res, missingFields.join(", "));
                }
            }
            
            // CASE 4: EITHER (Hybrid)
            else {
                if (!email && (!countryCode || !localNumber)){
                    logMiddlewareError("authModeValidator", "Either Email or Phone is required in EITHER auth mode", req);
                    return throwMissingFieldsError(res, "email OR (countryCode + localNumber)");
                }
                if (email && (countryCode && localNumber)){
                    logMiddlewareError("authModeValidator", "Both Email and Phone provided in EITHER auth mode", req);
                    return throwBadRequestError(res, "Provide either Email OR Phone, not both.");
                } 
            }

            // Email Validation
            if(email){
                if (!validateLength(email, emailLength.min, emailLength.max) || !isValidRegex(email, emailRegex)) {
                    validationErrors.push("Invalid Email format/length");
                }
            }

            let phone = null;

            if (countryCode && localNumber && authMode !== AuthModes.EMAIL) {
                phone = createPhoneNumber(countryCode, localNumber);
                req[location].phone = phone;
            }

            // Validate Phone Parts
            if (phone) {
                // 1. Validate Country Code
                const isCCValid = validateLength(countryCode, countryCodeLength.min, countryCodeLength.max) && 
                                  isValidRegex(countryCode, countryCodeRegex);
                
                if (!isCCValid) validationErrors.push("Invalid Country Code");

                // 2. Validate Local Number
                const isLNValid = validateLength(localNumber, localNumberLength.min, localNumberLength.max) && 
                                  isValidRegex(localNumber, localNumberRegex);
                
                if (!isLNValid) validationErrors.push("Invalid Local Number");
            }

            // STEP 2: Check Validation Errors and Respond
            
            // FINAL ERROR THROWING
            if (validationErrors.length > 0) {
                logMiddlewareError("authModeValidator", "Validation Failed", req);
                return throwValidationError(res, "Validation Failed", validationErrors.join(" | "));
            }

            logWithTime("✅ Auth mode validation passed");
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