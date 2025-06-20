const AuthLogModel = require("../models/auth-logs.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");

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
        const userID = logOptions.performedOn?.userID || req.user?.userID || null;
        const userType = req.user?.userType || logOptions.performedOn?.userType || "CUSTOMER";

        const baseLog = {
            userID: userID,
            eventType: eventType,
            deviceID: req.deviceID,
            performedBy: userType
        };

        if (req.deviceName) baseLog.deviceName = req.deviceName;
        if (req.deviceType) baseLog.deviceType = req.deviceType;

        // Admin-specific target actions
        if (logOptions.performedOn || logOptions.filter) {
            baseLog.adminActions = {};
            if (logOptions.performedOn?.userID)
                baseLog.adminActions.targetUserID = logOptions.performedOn.userID;
            if (logOptions.filter)
                baseLog.adminActions.filter = logOptions.filter;
        }

        const result = new AuthLogModel(baseLog);
        await result.save();
        logWithTime(`📘 AuthLog saved successfully: ${eventType} | user: ${userID} | device: ${req.deviceID}`);
    } catch (err) {
        logWithTime(`❌ Error saving AuthLog for event: ${eventType}`);
        errorMessage(err);
        throwInternalServerError(req.res);
    }
};

module.exports = {
    logAuthEvent: logAuthEvent
};
