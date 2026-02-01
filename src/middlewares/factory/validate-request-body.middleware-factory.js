const { validateMissingFields } = require("@utils/validate-fields.util"); // Generalized util
const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError } = require("@/responses/common/error-handler.response");
const { RequestLocation } = require("@configs/enums.config");

/**
 * Core Logic (Internal Use)
 */
const _genericPresenceCheck = (middlewareName, requiredFields, requestLocation) => {
    return (req, res, next) => {
        try {
            // Safety Check: Agar req.body/query undefined ho (halanki express handle karta hai)
            if (!req[requestLocation]) {
                req[requestLocation] = {}; 
            }

            const data = req[requestLocation];
            
            // Step 1: Utility Call
            const result = validateMissingFields(data, requiredFields);
            
            // Step 2: Error Handling
            if (!result.isValid) {
                logMiddlewareError(middlewareName, `${requestLocation} missing fields: ${result.missingFields.join(", ")}`, req);
                return throwMissingFieldsError(res, result.missingFields);
            }
            
            // Step 3: Trimmed/Cleaned data wapas set karo
            // Isse controller mein dobara .trim() nahi lagana padega
            req[requestLocation] = result.cleanedData;
            
            // Success Log (Optional)
            // logWithTime(`[${middlewareName}] ${requestLocation} fields present.`);
            
            return next();

        } catch (error) {
            logMiddlewareError(middlewareName, `Unexpected error in ${requestLocation} validation`, req);
            return throwInternalServerError(res, error);
        }
    };
};

/**
 * 1. Check Body Fields Wrapper
 */
const checkBodyPresence = (middlewareName, requiredFields) => {
    return _genericPresenceCheck(middlewareName, requiredFields, RequestLocation.BODY);
};

/**
 * 2. Check Query Params Wrapper (?page=1&limit=10)
 */
const checkQueryPresence = (middlewareName, requiredFields) => {
    return _genericPresenceCheck(middlewareName, requiredFields, RequestLocation.QUERY);
};

/**
 * 3. Check URL Params Wrapper (/users/:userId)
 */
const checkParamsPresence = (middlewareName, requiredFields) => {
    return _genericPresenceCheck(middlewareName, requiredFields, RequestLocation.PARAMS);
};

module.exports = { 
    checkBodyPresence, 
    checkQueryPresence, 
    checkParamsPresence 
};