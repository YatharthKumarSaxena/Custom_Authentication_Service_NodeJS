// middlewares/duplicate-query-parameter.middleware.js

const { deviceBasedRateLimiters } =
    require("@/rate-limiters/device-based.rate-limiter");
const { duplicateQueryParameterRateLimiter } = deviceBasedRateLimiters;
const { BAD_REQUEST } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const duplicateQueryParameterHandler = (req, res, next) => {

    for (const [key, value] of Object.entries(req.query)) {

        if (Array.isArray(value)) {

            logWithTime(
                `❌ Duplicate query parameter '${key}' in ${req.method} ${req.originalUrl}`
            );

            return duplicateQueryParameterRateLimiter(
                req,
                res,
                () => res.status(BAD_REQUEST).json({
                    code: "DUPLICATE_QUERY_PARAMETER",
                    message: `Duplicate query parameter '${key}' is not allowed`
                })
            );

        }

    }

    next();

};

module.exports = {
    duplicateQueryParameterHandler
};