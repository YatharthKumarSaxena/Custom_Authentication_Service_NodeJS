const { getAuthLogService } = require("@services/auth/auth-log.service");
const { throwInternalServerError, getLogIdentifiers } = require("@/responses/common/error-handler.response");
const { getMyAuthLogsSuccessResponse } = require("@/responses/success/index");
const { USER_VISIBLE_AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { logWithTime } = require("@utils/time-stamps.util");

const getMyAuthLogs = async (req, res) => {
    try {
        const user = req.user; // Full user object from middleware

        // 1. Sanitize Pagination Params
        let page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = Math.min(50, parseInt(req.query.limit) || 10); // Limit max 50 for safety

        // 2. Service Call
        const result = await getAuthLogService(user, page, limit, {
            visibleEvents: USER_VISIBLE_AUTH_LOG_EVENTS
        });

        // 3. Response with Meta-Data
        return getMyAuthLogsSuccessResponse(res, user, page, result, limit);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error in getAuthLog for ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { getMyAuthLogs };