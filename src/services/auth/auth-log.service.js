const { AuthLogModel } = require("@models/auth-log.model");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Fetch paginated auth logs for a user
 */
const getAuthLogService = async (user, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        // 1. Parallel execution for Logs and Total Count (Performance boost)
        const [logs, totalCount] = await Promise.all([
            AuthLogModel.find({ userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("eventType createdAt deviceName deviceType ipAddress message")
                .lean(),
            AuthLogModel.countDocuments({ userId: user._id })
        ]);

        const formattedLogs = logs.map(log => ({
            event: log.eventType,
            time: log.createdAt,
            device: log.deviceName || "Unknown Device",
            type: log.deviceType || "Unknown",
            // Security: Pure IP nahi dikhate, partially mask kar sakte ho
            locationInfo: log.message || "" 
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