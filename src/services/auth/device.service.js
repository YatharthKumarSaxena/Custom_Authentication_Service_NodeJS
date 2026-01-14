const { DeviceModel } = require("@/models/device.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { cloneForAudit, prepareAuditData } = require("@utils/audit-data.util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Returns: { deviceDoc, auditLogPayload (or null) }
 */
const syncDeviceData = async ( device, { session }) => {
    try {

        const { deviceUUID, deviceName, deviceType } = device;

        let deviceDoc = await DeviceModel.findOne({ deviceUUID: deviceUUID }).session(session); 

        let auditLogPayload = null;

        if (deviceDoc) {
            // Existing Device Logic
            const oldDeviceSnapshot = cloneForAudit(deviceDoc);

            let shouldUpdate = false;

            // ✅ CORRECTION: Input vs DB comparison
            if (deviceName && deviceDoc.deviceName !== deviceName) {
                deviceDoc.deviceName = deviceName;
                shouldUpdate = true;
            }
            if (deviceType && deviceDoc.deviceType !== deviceType) {
                deviceDoc.deviceType = deviceType;
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                const updatedDevice = await deviceDoc.save({ session });
                
                // Payload prepare karo, Log mat karo
                const { oldData, newData } = prepareAuditData(oldDeviceSnapshot, updatedDevice);
                
                auditLogPayload = {
                    event: AUTH_LOG_EVENTS.DEVICE_UPDATE,
                    message: `Device ID ${deviceUUID} metadata updated.`,
                    metadata: { oldData, newData }
                };
                
                return { deviceDoc: updatedDevice, auditLogPayload };
            }
            
            return { deviceDoc: deviceDoc, auditLogPayload: null };

        } else {
            // New Device Logic
            const newDevice = new DeviceModel({
                deviceUUID: deviceUUID,
                deviceName: deviceName || null,
                deviceType: deviceType || null
            });
            
            const savedDevice = await newDevice.save({ session });
            const auditData = prepareAuditData(null, savedDevice);

            auditLogPayload = {
                event: AUTH_LOG_EVENTS.DEVICE_CREATE,
                message: `New device ID ${deviceUUID} registered.`,
                metadata: { oldData: auditData.oldData, newData: auditData.newData }
            };

            return { deviceDoc: savedDevice, auditLogPayload };
        }
    } catch (error) {
        logWithTime(`❌ Error syncing device (${device.deviceUUID})`);
        throw error;
    }
};

/**
 * Returns: { mappingDoc, auditLogPayload (or null) }
 */
const syncUserDeviceMapping = async (user, deviceDoc, { session }) => {
    try {
        const userId = user._id;
        const deviceObjectId = deviceDoc._id;
        let auditLogPayload = null;

        let userDeviceDoc = await UserDeviceModel.findOne({ userId, deviceId: deviceObjectId }).session(session);

        if (userDeviceDoc) {
            const oldMappingSnapshot = cloneForAudit(userDeviceDoc);

            userDeviceDoc.lastLoginAt = new Date();
            userDeviceDoc.loginCount = (userDeviceDoc.loginCount || 0) + 1;

            const updatedMapping = await userDeviceDoc.save({ session });
            const { oldData, newData } = prepareAuditData(oldMappingSnapshot, updatedMapping);

            auditLogPayload = {
                event: AUTH_LOG_EVENTS.USER_DEVICE_UPDATE,
                message: `User-Device session updated.`,
                metadata: { oldData, newData }
            };

            return { mappingDoc: updatedMapping, auditLogPayload };

        } else {
            const newUserDevice = new UserDeviceModel({
                userId,
                deviceId: deviceObjectId,
                lastLoginAt: new Date(),
                loginCount: 1,
                firstSeenAt: new Date()
            });

            const savedMapping = await newUserDevice.save({ session });
            const auditData = prepareAuditData(null, savedMapping);

            auditLogPayload = {
                event: AUTH_LOG_EVENTS.USER_DEVICE_CREATE,
                message: `New User-Device connection established.`,
                metadata: { oldData: auditData.oldData, newData: auditData.newData }
            };

            return { mappingDoc: savedMapping, auditLogPayload };
        }
    } catch (error) {
        logWithTime(`❌ Error in syncUserDeviceMapping`);
        throw error;
    }
};

module.exports = { syncDeviceData, syncUserDeviceMapping };