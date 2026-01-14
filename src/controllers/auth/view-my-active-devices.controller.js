const { OK } = require("@configs/http-status.config");
const { getActiveSessionsService } = require("@services/auth/active-sessions.service");
const { logWithTime } = require("@utils/time-stamps.util");
const { throwInternalServerError, throwSpecificInternalServerError } = require("@utils/error-handler.util");

/**
 * Controller to get all active sessions for a user
 */
const getMyActiveSessions = async (req, res) => {
    try {
        const user = req.user; // From auth middleware
        const currentDeviceId = req.device.deviceUUID; // Current device from middleware

        // 1. Call service
        const activeSessions = await getActiveSessionsService(user, currentDeviceId);

        if (activeSessions === null) {
            logWithTime(`❌ Failed to fetch active sessions for User ${user.userId} on Device ${currentDeviceId}`);
            return throwSpecificInternalServerError(res, { message: "Failed to fetch active sessions. Please try again later." });
        }
        // 2. Respond
        return res.status(OK).json({
            success: true,
            message: "Active sessions fetched successfully.",
            activeSessions
        });

    } catch (err) {
        logWithTime(`❌ Error fetching active sessions for user ${req.user.userId}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { getMyActiveSessions };
