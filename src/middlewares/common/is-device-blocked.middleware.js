const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, logMiddlewareError, throwAccessDeniedError } = require("@/responses/common/error-handler.response");
const { DeviceModel } = require("@models/device.model");

const isDeviceBlocked = async (req, res, next) => {
    try {
        let device = req.device;
        const dbDevice = await DeviceModel.findOne({ deviceUUID: req.device.deviceUUID }).lean();
        if (dbDevice) {
            device = dbDevice;
            req.device = device;
        }
        if (dbDevice && device.isBlocked === true) {
            logMiddlewareError("isDeviceBlocked", "Device is blocked", req);
            return throwAccessDeniedError(
                res, 
                "Your Device is currently blocked. Please contact support for assistance if you believe this is an error."
            );
        }
        logWithTime(`✅ Device (${device.deviceUUID}) is not blocked`);

        return next();
    } catch (err) {
        logMiddlewareError("isDeviceBlocked", "Internal error during device blocked check", req);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    isDeviceBlocked
}