const { throwInternalServerError, throwMissingFieldsError, logMiddlewareError, throwBadRequestError, throwValidationError } = require("@/responses/common/error-handler.response");
const { isValidUUID, isValidDeviceNameLength } = require("@utils/id-validators.util");
const { DeviceTypeHelper } = require("@utils/enum-validators.util");
const { deviceNameLength } = require("@configs/fields-length.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { DEVICE_HEADERS } = require("@/configs/headers.config");

const verifyDeviceField = async (req, res, next) => {
    try {
        let uuid = req.headers[DEVICE_HEADERS.DEVICE_UUID];
        let name = req.headers[DEVICE_HEADERS.DEVICE_NAME]; // Optional
        let type = req.headers[DEVICE_HEADERS.DEVICE_TYPE]; // Optional

        let deviceUUID = null;
        let deviceName = null;
        let deviceType = null;

        // Device ID is mandatory
        if (!uuid || uuid.trim() === "") {
            logMiddlewareError("verifyDeviceField", "Missing device UUID in headers", req);
            return throwMissingFieldsError(res, "Device UUID (x-device-uuid) is required in request headers");
        }

        uuid = uuid.trim();

        if (!isValidUUID(uuid)) {
            logMiddlewareError("verifyDeviceField", "Invalid Device ID format", req);
            return throwValidationError(res, {deviceUUID: "Invalid deviceUUID format. Must be a valid UUID v4"});
        }

        deviceUUID = uuid;

        if (name && name.trim() !== "") {
            name = name.trim();
            if (!isValidDeviceNameLength(name)) {
                logMiddlewareError("verifyDeviceField", "Invalid Device Name length", req);
                return throwValidationError(res, { deviceName: `Invalid length, must be between ${deviceNameLength.min} and ${deviceNameLength.max} characters` })
            }
            deviceName = name;
        }

        if (type && type.trim() !== "") {
            const lowerType = type.trim();
            if (!DeviceTypeHelper.validate(lowerType)) {
                logMiddlewareError("verifyDeviceField", "Invalid Device Type", req);
                const validTypes = DeviceTypeHelper.getValidValues().join(', ');
                return throwBadRequestError(res, `Invalid device type. Must be one of: ${validTypes}`);
            }
            deviceType = lowerType;
        }

        req.device = { deviceUUID, deviceName, deviceType };

        logWithTime(`✅ Device field verification passed for device ID: ${deviceUUID}`);

        return next(); // Pass control to the next middleware/controller
    } catch (err) {
        const deviceUUID = req.headers["x-device-uuid"] || "Unauthorized Device ID";
        logWithTime(`⚠️ Error occurred while validating the Device field having device id: ${deviceUUID}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    verifyDeviceField
}