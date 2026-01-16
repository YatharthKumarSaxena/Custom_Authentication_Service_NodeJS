const { AuthLogModel } = require("@models/auth-logs.model"); // Path adjust karlena
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Service to fetch Auth Logs with Pagination
 * @param {Object} targetUser - The user object (must contain userId)
 * @param {Number} page - Current page number
 * @param {Number} limit - Records per page
 */
const getAuthLogService = async (targetUser, page, limit) => {
    try {
        const skip = (page - 1) * limit;

        // Query: Hum schema ke 'userId' field se match karenge
        const query = { userId: targetUser.userId };

        // 1. Fetch Logs (Sorted by latest first)
        const logs = await AuthLogModel.find(query)
            .sort({ createdAt: -1 }) // Newest logs first
            .skip(skip)
            .limit(limit)
            .lean(); // JSON object return karega (faster)

        // 2. Count Total Documents (For pagination metadata)
        const totalCount = await AuthLogModel.countDocuments(query);

        return {
            logs,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        };

    } catch (error) {
        logWithTime(`❌ Service Error: Failed to fetch auth logs for ${targetUser.userId}`);
        throw error; // Controller catch karega
    }
};

module.exports = { getAuthLogService };