const { OK } = require("@configs/http-status.config");
const { getAuthLogService } = require("@services/auth/auth-log.service");
const { throwInternalServerError, throwDBResourceNotFoundError, getLogIdentifiers } = require("@utils/error-handler.util");
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
        logWithTime(`✅ Admin fetched auth logs for user ${targetUser.userId} (Page: ${page})`);

        return res.status(OK).json({
            success: true,
            message: "User activity logs retrieved successfully.",
            meta: {
                targetUser: {
                    userId: targetUser.userId,
                    email: targetUser.email
                },
                totalLogs: result.totalCount,
                currentPage: page,
                totalPages: result.totalPages,
                limit
            },
            logs: result.logs
        });

    } catch (err) {
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error in getUserAuthLogs for target ${req.params.userId} by ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { 
    getUserAuthLogs   // Admin ke liye
};