const { AuthLogModel } = require("@models/auth-logs.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");

/**
 * 🔐 Logs an authentication event (fire-and-forget)
 */
const logAuthEvent = (user, device, eventType, description, logOptions = {}) => {
    (async () => {
        try {
            const userId = user.userId;
            
            const baseLog = {
                userId: userId,
                eventType: eventType,
                description: description,
                deviceId: device.deviceUUID
            };

            if (device.deviceName) baseLog.deviceName = device.deviceName;
            if (device.deviceType) baseLog.deviceType = device.deviceType;
            if (logOptions){
                baseLog.oldData = logOptions.oldData || null;
                baseLog.newData = logOptions.newData || null;
            }
            const result = new AuthLogModel(baseLog);
            await result.save();
            logWithTime(`📘 AuthLog saved successfully: ${eventType} | user: ${userId} | device: ${device.deviceUUID}`);
        } catch (err) {
            logWithTime(`❌ Internal Error saving AuthLog for event: ${eventType}`);
            errorMessage(err);
            return;
        }
    })();
};

module.exports = {
    logAuthEvent
};
