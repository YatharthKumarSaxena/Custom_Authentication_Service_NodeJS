const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, logMiddlewareError, throwAccessDeniedError } = require("@utils/error-handler.util");

const isDeviceBlocked = async (req, res, next) => {
    try {
        const device = req.device;
        if (device.isBlocked === true) {
            logMiddlewareError("isDeviceBlocked", "Device is blocked", req);
            return throwAccessDeniedError(
                res, 
                "Your Device is currently blocked. Please contact support for assistance if you believe this is an error."
            );
        }
        logWithTime(`✅ Device (${device.deviceId}) is not blocked`);

        return next();
    } catch (err) {
        logMiddlewareError("isDeviceBlocked", "Internal error during device blocked check", req);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    isDeviceBlocked
}