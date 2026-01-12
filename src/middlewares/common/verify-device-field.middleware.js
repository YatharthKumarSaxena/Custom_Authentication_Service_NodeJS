const { throwInternalServerError, throwMissingFieldsError, logMiddlewareError, throwBadRequestError, throwValidationError } = require("@utils/error-handler.util");
const { isValidUUID, isValidDeviceNameLength } = require("@utils/id-validators.util");
const { DeviceTypeHelper } = require("@utils/enum-validators.util");
const { deviceNameLength } = require("@configs/fields-length.config");
const { DeviceModel } = require("@models/device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { DEVICE_HEADERS } = require("@configs/device-headers.config");

const verifyDeviceField = async (req, res, next) => {
    try {
        const deviceId = req.headers[DEVICE_HEADERS.DEVICE_UUID];
        let deviceName = req.headers[DEVICE_HEADERS.DEVICE_NAME]; // Optional
        const deviceType = req.headers[DEVICE_HEADERS.DEVICE_TYPE]; // Optional

        // Device ID is mandatory
        if (!deviceId || deviceId.trim() === "") {
            logMiddlewareError("verifyDeviceField", "Missing device UUID in headers", req);
            return throwMissingFieldsError(res, "Device UUID (x-device-uuid) is required in request headers");
        }

        // Attach to request object for later use in controller
        req.deviceId = deviceId.trim();

        if (!isValidUUID(req.deviceId)) {
            logMiddlewareError("verifyDeviceField", "Invalid Device ID format", req);
            return throwValidationError(res, {deviceId: "Invalid deviceId format. Must be a valid UUID v4"});
        }

        if (deviceName && deviceName.trim() !== "") {
            deviceName = deviceName.trim();
            if (!isValidDeviceNameLength(deviceName)) {
                logMiddlewareError("verifyDeviceField", "Invalid Device Name length", req);
                return throwValidationError(res, { deviceName: `Invalid length, must be between ${deviceNameLength.min} and ${deviceNameLength.max} characters` })
            }
            req.deviceName = deviceName;
        }

        if (deviceType && deviceType.trim() !== "") {
            const type = deviceType.toLowerCase().trim();
            if (!DeviceTypeHelper.validate(type)) {
                logMiddlewareError("verifyDeviceField", "Invalid Device Type", req);
                const validTypes = DeviceTypeHelper.getValidValues().join(', ');
                return throwBadRequestError(res, `Invalid device type. Must be one of: ${validTypes}`);
            }
            req.deviceType = type;
        }
        logWithTime(`✅ Device field verification passed for device ID: ${req.deviceId}`);
        const device = await DeviceModel.findOne({ deviceId: req.deviceId }).lean();
        if (device) {
            logWithTime(`✅ Existing Device document found for device ID: ${req.deviceId}`);
            let shouldUpdate = false;
            const updatePayload = {};

            if (req.deviceName && device.deviceName !== req.deviceName) {
                updatePayload.deviceName = req.deviceName;
                shouldUpdate = true;
            }

            if (req.deviceType && device.deviceType !== req.deviceType) {
                updatePayload.deviceType = req.deviceType;
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                await DeviceModel.updateOne(
                    { deviceId: req.deviceId },
                    { $set: updatePayload }
                );
                Object.assign(device, updatePayload);
            }
            if(shouldUpdate){
                logWithTime(`✅ Device document updated for device ID: ${req.deviceId}`);
            }
            req.device = device; // Attach device document to request object
        } else {
            // Create Device Document
            const newDevice = new DeviceModel({
                deviceId: req.deviceId,
                deviceName: req.deviceName || null,
                deviceType: req.deviceType || null
            });
            const savedDevice = await newDevice.save();
            req.device = savedDevice.toObject();
            logWithTime(`✅ New Device document created for device ID: ${req.deviceId}`);
        }
        return next(); // Pass control to the next middleware/controller
    } catch (err) {
        const deviceId = req.headers["x-device-uuid"] || "Unauthorized Device ID";
        logWithTime(`⚠️ Error occurred while validating the Device field having device id: ${deviceId}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = {
    verifyDeviceField
}