const { USER_VISIBLE_AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { AuthLogModel } = require("@models/auth-logs.model");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Fetch paginated auth logs for a user
 */
const getAuthLogService = async (user, page = 1, limit = 10, options = {}) => {
    try {
        const skip = (page - 1) * limit;
        const query = { userId: user.userId };

        if (Array.isArray(USER_VISIBLE_AUTH_LOG_EVENTS) && USER_VISIBLE_AUTH_LOG_EVENTS.length > 0) {
            query.eventType = { $in: USER_VISIBLE_AUTH_LOG_EVENTS };
        } 

        // 1. Parallel execution for Logs and Total Count (Performance boost)
        const [logs, totalCount] = await Promise.all([
            AuthLogModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("eventType createdAt deviceName deviceType description")
                .lean(),
            AuthLogModel.countDocuments(query)
        ]);

        const formattedLogs = logs.map(log => ({
            event: log.eventType,
            time: log.createdAt,
            device: log.deviceName || "Unknown Device",
            type: log.deviceType || "Unknown"
        }));

        return {
            logs: formattedLogs,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        };

    } catch (err) {
        logWithTime(`❌ DB Error fetching logs for user ${user.userId}: ${err.message}`);
        return null;
    }
};

module.exports = { getAuthLogService };