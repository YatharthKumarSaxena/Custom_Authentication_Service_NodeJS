const {logWithTime} = require("../utils/time-stamps.utils");
const { malformedAndWrongRequestRateLimiter } = require("../rate-limiters/special-api-rate-limiter");
const { BAD_REQUEST, INTERNAL_ERROR } = require("./http-status.config");

exports.malformedJsonHandler = async (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === BAD_REQUEST && "body" in err) {
        logWithTime("⛔ Malformed JSON detected in request body.");
        logWithTime(`🔎 Request Details: ${req.method} ${req.originalUrl}`);
        logWithTime(`📨 Headers: ${JSON.stringify(req.headers)}`);

        const deviceID = req.headers["x-device-uuid"];
        if (!deviceID) {
            logWithTime("🟠 Malformed JSON AND missing device ID."); // More accurate
            return res.status(BAD_REQUEST).json({
                success: false,
                type: "MissingDeviceID",
                message: "Device ID (x-device-uuid) is missing in headers, required for rate limiting.",
            });
        }

        req.deviceID = deviceID; // Attach it even in this broken state

        return malformedAndWrongRequestRateLimiter(req, res, () => {
            return res.status(BAD_REQUEST).json({
                success: false,
                type: "MalformedRequest",
                message: "The request body contains invalid JSON format. Please fix it.",
            });
        });
    }

    return next(err);
};



/**
 * 🔥 Catches all uncaught errors thrown anywhere in the route chain.
 * ✅ Logs detailed message and prevents server crash
 */
exports.globalErrorHandler = (err, req, res, next) => {
    logWithTime("💥 Uncaught Server Error: " + err.message);

    // Optional: stack trace in development
    if (process.env.NODE_ENV === "development") {
        console.log(err.stack);
    }

    if (res.headersSent) return; // 🔐 Prevent duplicate response

    return res.status(INTERNAL_ERROR).json({
        success: false,
        type: "InternalServerError",
        message: "🔧 Internal Server Error! Please try again later."
    });
};