const AuthLogModel = require("../models/auth-logs.model");
const { logWithTime } = require("./time-stamps.util");
const { errorMessage } = require("../configs/error-handler.configs");

/**
 * 🔐 Logs an authentication event (fire-and-forget)
 */
const logAuthEvent = (req, eventType, logOptions = {}) => {
    (async () => {
        try {
            const userID = req.user?.userID || req.foundUser?.userID || null;
            
            const baseLog = {
                userID: userID,
                eventType: eventType,
                deviceID: req.deviceID
            };

            if (req.deviceName) baseLog.deviceName = req.deviceName;
            if (req.deviceType) baseLog.deviceType = req.deviceType;

            const result = new AuthLogModel(baseLog);
            await result.save();
            logWithTime(`📘 AuthLog saved successfully: ${eventType} | user: ${userID} | device: ${req.deviceID}`);
        } catch (err) {
            logWithTime(`❌ Internal Error saving AuthLog for event: ${eventType}`);
            errorMessage(err);
            return;
        }
    })();
};

const adminAuthLogForSetUp = (user, eventType) => {
    (async () => {
        try{
            const deviceID = user.devices?.info[0]?.deviceID || process.env.DEVICE_UUID;
            const baseLog = {
                userID: user.userID,
                eventType: eventType,
                deviceID: deviceID
            };

            baseLog.deviceName = user.devices?.info[0]?.deviceName || process.env.DEVICE_NAME;
            baseLog.deviceType = user.devices?.info[0]?.deviceType || process.env.DEVICE_TYPE;

            const result = new AuthLogModel(baseLog);
            await result.save();
            logWithTime(`📘 AuthLog saved successfully: ${eventType} | user: ${user.userID} | device ID: ${deviceID}`);
        }catch(err){
            logWithTime(`❌ Internal Error saving AuthLog for Admin event: ${eventType} at set up phase`);
            errorMessage(err);
            return;
        }
    })();
};

module.exports = {
    logAuthEvent,
    adminAuthLogForSetUp
};
