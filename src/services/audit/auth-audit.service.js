const { AuthLogModel } = require("@models/auth-logs.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { ENABLE_AUTH_SESSION_LOGGING } = require("@/configs/security.config");

/**
 * Logs an authentication event (fire-and-forget)
 */
const logAuthEvent = (user, device, requestId, eventType, description, logOptions = {}) => {
    (async () => {
        try {

            if (!ENABLE_AUTH_SESSION_LOGGING)return;
            const userId = user.userId;
            
            const baseLog = {
                userId: userId,
                eventType: eventType,
                description: description,
                deviceId: device.deviceUUID,
                requestId: requestId
            };

            if (device.deviceName) baseLog.deviceName = device.deviceName;
            if (device.deviceType) baseLog.deviceType = device.deviceType;
            if (logOptions){
                baseLog.oldData = logOptions.oldData || null;
                baseLog.newData = logOptions.newData || null;
            }
            const result = new AuthLogModel(baseLog);
            await result.save();
            logWithTime(`📘 AuthLog saved successfully: ${eventType} | user: ${userId} | device: ${device.deviceUUID} | requestId: ${requestId}`);
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
