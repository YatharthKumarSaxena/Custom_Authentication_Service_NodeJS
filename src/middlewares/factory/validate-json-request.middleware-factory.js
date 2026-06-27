// middlewares/validate-json-request.middleware.js

const { validateAndParseJson } = require("@/utils/validate-json.util");
const {
    throwBadRequestError,
    throwInternalServerError,
    logMiddlewareError
} = require("@/responses/common/error-handler.response");

const { RequestLocation } = require("@configs/enums.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const _validateJsonRequest = (
    middlewareName,
    requestLocation,
    fields
) => {

    return (req, res, next) => {

        try {

            const requestData = req[requestLocation];

            if (!requestData) {
                logMiddlewareError(
                    middlewareName,
                    `Invalid request location: ${requestLocation}`,
                    req
                );

                return throwInternalServerError(
                    res,
                    new Error("Invalid request location")
                );
            }

            if (!Array.isArray(fields) || fields.length === 0) {
                logMiddlewareError(
                    middlewareName,
                    "No JSON fields provided",
                    req
                );

                return throwInternalServerError(
                    res,
                    new Error("JSON fields are required")
                );
            }

            for (const field of fields) {

                const value = requestData[field];

                if (value === undefined || value === null) {
                    continue;
                }

                const validationResult = validateAndParseJson(
                    value,
                    field
                );

                if (!validationResult.success) {

                    logMiddlewareError(
                        middlewareName,
                        validationResult.message,
                        req
                    );

                    return throwBadRequestError(
                        res,
                        validationResult.message
                    );
                }

            }

            logWithTime(
                `✅ [${middlewareName}] ${req.method} ${req.originalUrl} ${requestLocation} JSON validation passed.`
            );
            return next();

        } catch (error) {

            logMiddlewareError(
                middlewareName,
                "JSON validation middleware failed",
                req
            );

            return throwInternalServerError(
                res,
                error
            );

        }

    };

};

const validateJsonBody = (
    middlewareName,
    fields
) => {

    return _validateJsonRequest(
        middlewareName,
        RequestLocation.BODY,
        fields
    );

};

const validateJsonQuery = (
    middlewareName,
    fields
) => {

    return _validateJsonRequest(
        middlewareName,
        RequestLocation.QUERY,
        fields
    );

};

const validateJsonParams = (
    middlewareName,
    fields
) => {

    return _validateJsonRequest(
        middlewareName,
        RequestLocation.PARAMS,
        fields
    );

};

module.exports = {
    validateJsonBody,
    validateJsonQuery,
    validateJsonParams
};