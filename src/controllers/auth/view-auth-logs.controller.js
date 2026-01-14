const { OK } = require("@configs/http-status.config");
const { getAuthLogService } = require("@services/auth/auth-log.service");
const { throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const getMyAuthLogs = async (req, res) => {
    try {
        const user = req.user; // Full user object from middleware

        // 1. Sanitize Pagination Params
        let page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = Math.min(50, parseInt(req.query.limit) || 10); // Limit max 50 for safety

        // 2. Service Call
        const result = await getAuthLogService(user, page, limit);

        // 3. Response with Meta-Data
        logWithTime(`✅ Auth logs fetched for user ${user.userId} (Page: ${page})`);

        return res.status(OK).json({
            success: true,
            message: "Activity logs retrieved successfully.",
            meta: {
                totalLogs: result.totalCount,
                currentPage: page,
                totalPages: result.totalPages,
                limit
            },
            logs: result.logs
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error in getAuthLog for ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { getMyAuthLogs };