const { getAuthLogService } = require("@services/auth/auth-log.service");
const { throwInternalServerError, throwDBResourceNotFoundError, getLogIdentifiers } = require("@/responses/common/error-handler.response");
const { getUserAuthLogsAdminSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");
const { UserModel } = require("@models/user.model"); 


const getUserAuthLogs = async (req, res) => {
    try {
        const { userId } = req.params; // URL se userId (e.g., USER-1234)

        // 1. Sanitize Pagination Params
        let page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = Math.min(100, parseInt(req.query.limit) || 20); 

        // 2. Validate Target User (Check agar user DB mein hai)
        const targetUser = await UserModel.findOne({ userId: userId }).select("userId email _id");

        if (!targetUser) {
            logWithTime(`⚠️ Admin tried to fetch logs for non-existent user: ${userId}`);
            return throwDBResourceNotFoundError(res, `User with ID ${userId}`);
        }

        // 3. Service Call (Reusing the same service)
        const result = await getAuthLogService(targetUser, page, limit);

        // 4. Response with Meta-Data
        return getUserAuthLogsAdminSuccessResponse(res, targetUser, page, result, limit);

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error in getUserAuthLogs for target ${req.params.userId} by ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { 
    getUserAuthLogs   // Admin ke liye
};