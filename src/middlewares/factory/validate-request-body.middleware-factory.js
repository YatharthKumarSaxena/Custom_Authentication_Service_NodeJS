const { validateRequestBody } = require("@utils/validate-request-body.util");
const { throwInternalServerError, logMiddlewareError, throwMissingFieldsError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const validateRequestBodyMiddleware = (requiredFields, middlewareName) => {
    return (req, res, next) => {
        try {
            const result = validateRequestBody(req.body, requiredFields);
            
            if (!result.valid) {
                logMiddlewareError(middlewareName, "Request body validation failed", req);
                return throwMissingFieldsError(res, result.missingFields);
            }
            
            // Apply trimmed body back to request
            req.body = result.trimmedBody;
            
            logWithTime(`✅ [${middlewareName}] All required fields present and valid`);
            return next();
        } catch (error) {
            logMiddlewareError(middlewareName, "Unexpected error occurred", req);
            return throwInternalServerError(res, error);
        }

    };
};

module.exports = {
    validateRequestBodyMiddleware
};