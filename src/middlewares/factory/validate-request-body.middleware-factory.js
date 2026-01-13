const { validateRequestBody } = require("@utils/validate-request-body.util"); // Is util ko bhi generalize karna pad sakta hai
const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { RequestLocation } = require("@/configs/enums.config");

/**
 * @param {Array} requiredFields - List of keys
 * @param {string} middlewareName - Logging ke liye
 * @param {string} requestLocation - 'body', 'query', ya 'params'
 */

const validateRequestPresenceMiddleware = (requiredFields, middlewareName, requestLocation = RequestLocation.BODY) => {
    return (req, res, next) => {
        try {
            // Hum validateRequestBody util ko data aur fields pass kar rahe hain
            const result = validateRequestBody(req[requestLocation], requiredFields);
            
            if (!result.valid) {
                logMiddlewareError(middlewareName, `${requestLocation} missing required fields`, req);
                return throwMissingFieldsError(res, result.missingFields);
            }
            
            // Trimmed data wapas usi location par set kar rahe hain
            req[requestLocation] = result.trimmedBody;
            
            logWithTime(`✅ [${middlewareName}] All required fields in ${requestLocation} are present`);
            return next();
        } catch (error) {
            logMiddlewareError(middlewareName, "Unexpected presence validation error", req);
            return throwInternalServerError(res, error);
        }
    };
};

module.exports = { validateRequestPresenceMiddleware };