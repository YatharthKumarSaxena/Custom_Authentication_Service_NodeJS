const AuthLogModel = require("../models/auth-logs.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { errorMessage } = require("../configs/error-handler.configs");

/**
 * 🔐 Logs an authentication event with full context (user, admin, device info)
 * @param {Object} req - The request object (must contain userID, userType, deviceID)
 * @param {String} eventType - Enum value of the event (LOGIN, REGISTER, BLOCKED, etc.)
 * @param {Object} [logOptions] - Optional fields:
 *    - performedOn: user object being acted upon (for admin actions)
 *    - filter: for audit filtering logs
 */
const logAuthEvent = async (req, eventType, logOptions = {}) => {
    try {
        const userID = req.user?.userID || req.foundUser?.userID || null;
        const performedBy = eventType.toLowerCase().includes("token") ? "SYSTEM" : (req.user?.userType || req.foundUser?.userType || "CUSTOMER");
        
        const baseLog = {
            userID: userID,
            eventType: eventType,
            deviceID: req.deviceID,
            performedBy: performedBy
        };

        if (req.deviceName) baseLog.deviceName = req.deviceName;
        if (req.deviceType) baseLog.deviceType = req.deviceType;

        // Admin-specific target actions
        if (logOptions && (logOptions.performedOn?.userType || logOptions.filter)) {
            baseLog.adminActions = {};
            if (logOptions.performedOn)
                baseLog.adminActions.targetUserID = logOptions.adminActions.targetUserID;
            if (logOptions.filter)
                baseLog.adminActions.filter = logOptions.filter || null;
            if (logOptions.reason || req.body?.reason || req.query?.reason) {
                baseLog.adminActions.reason =  req.body?.reason?.trim() || req.query?.reason?.trim() || logOptions.adminActions?.reason?.trim() || null;
            }
        }

        const result = new AuthLogModel(baseLog);
        await result.save();
        logWithTime(`📘 AuthLog saved successfully: ${eventType} | user: ${userID} | device: ${req.deviceID}`);
    } catch (err) {
        logWithTime(`❌ Internal Error saving AuthLog for event: ${eventType}`);
        errorMessage(err);
        return;
    }
};

const adminAuthLogForSetUp = async(user,eventType) => {
    try{
        const deviceID = user.devices?.info[0]?.deviceID || process.env.DEVICE_UUID;
        const baseLog = {
            userID: user.userID,
            eventType: eventType,
            deviceID: deviceID,
            performedBy: user.userType
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
};

module.exports = {
    logAuthEvent: logAuthEvent,
    adminAuthLogForSetUp: adminAuthLogForSetUp
};
