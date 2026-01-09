const { throwInternalServerError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * 🔥 Catches all uncaught errors thrown anywhere in the route chain.
 * ✅ Logs detailed message and prevents server crash
 */

const globalErrorHandler = (err, req, res, next) => {
    logWithTime("💥 Uncaught Server Error: " + err.message);
    return throwInternalServerError(res, err);
};

module.exports = { globalErrorHandler };