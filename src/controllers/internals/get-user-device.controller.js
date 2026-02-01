const { getActiveSessionsService } = require("@services/internals/get-user-device.service");
const { UserModel } = require("@models/user.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { throwDBResourceNotFoundError, throwInternalServerError } = require("@/responses/common/error-handler.response");
const { getUserSessionsForAdminSuccessResponse, getUserSessionsForAdminNoSessionsResponse } = require("@/responses/success/index");

/**
 * Controller: Get Session Details for a specific User (Admin View)
 * Route: GET /admin/users/:userId/sessions
 */
const getUserSessionsForAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. User Validation
        const targetUser = await UserModel.findById(userId).select("_id email"); 
        if (!targetUser) {
            logWithTime(`❌ User with ID ${userId} not found while fetching sessions by Admin.`);
            // FIX: 'throw' hata diya, 'return' use karo
            return throwDBResourceNotFoundError(res, `User with ID ${userId}`);
        }

        // 2. Service Call
        const sessions = await getActiveSessionsService(targetUser);

        // Handle DB Error (Service returns null on error)
        if (sessions === null) {
            return throwInternalServerError(res, "Failed to fetch session data");
        }

        // Handle Empty Sessions (User has never logged in or cleared sessions)
        if (sessions.length === 0) {
            logWithTime(`⚠️ No sessions found for User (${userId}) by Admin.`);
            return getUserSessionsForAdminNoSessionsResponse(res, targetUser);
        }

        // 3. FIX: Stats Calculation (Kyunki ab mixed sessions aa rahe hain)
        const activeCount = sessions.filter(s => !s.isExpired).length;
        const expiredCount = sessions.length - activeCount;

        logWithTime(`🔍 Admin (${req.admin.adminId}) fetched sessions for User (${userId}).`);

        // 4. Response
        return getUserSessionsForAdminSuccessResponse(res, req.admin, targetUser, sessions);

    } catch (error) {
        const userId = req.params.userId;
        logWithTime(`❌ Internal Error fetching user sessions of ${userId} for admin ${req.admin?.adminId || 'Unknown'}`);
        return throwInternalServerError(res, error);
    }
};

module.exports = { getUserSessionsForAdmin };