// INTERNAL/ADMIN SUCCESS RESPONSES

const { OK } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const getUserDetailsAdminSuccessResponse = (res, admin, targetUserId, data) => {
    logWithTime(`🔍 Admin (${admin.adminId}) viewed profile of User (${targetUserId})`);
    return res.status(OK).json({
        success: true,
        message: "User details fetched successfully.",
        data: data
    });
};

const toggleDeviceBlockSuccessResponse = (res, admin, deviceUUID, message) => {
    logWithTime(`✅ Admin (${admin.adminId}) successfully modified device: ${deviceUUID}`);
    return res.status(OK).json({
        success: true,
        message: message
    });
};

const getUserSessionsForAdminSuccessResponse = (res, admin, targetUser, sessions) => {
    const activeCount = sessions.filter(s => !s.isExpired).length;
    const expiredCount = sessions.length - activeCount;
    
    logWithTime(`🔍 Admin (${admin.adminId}) fetched sessions for User (${targetUser._id}).`);
    
    return res.status(OK).json({
        success: true,
        message: "User sessions fetched successfully",
        data: {
            userId: targetUser._id,
            email: targetUser.email,
            summary: {
                total: sessions.length,
                active: activeCount,
                expired: expiredCount
            },
            sessions: sessions
        }
    });
};

const getUserSessionsForAdminNoSessionsResponse = (res, targetUser) => {
    logWithTime(`🔍 No sessions found for User (${targetUser.userId}).`);
    return res.status(OK).json({
        success: true,
        message: "No sessions found for the user.",
        data: {
            userId: targetUser._id,
            summary: {
                total: 0,
                active: 0,
                expired: 0
            },
            sessions: []
        }
    });
};

const toggleUserBlockSuccessResponse = (res, admin, userId, message) => {
    logWithTime(`✅ Admin (${admin.adminId}) successfully modified user: ${userId}`);
    return res.status(OK).json({
        success: true,
        message: message
    });
};

const getUserAuthLogsAdminSuccessResponse = (res, targetUser, page, result, limit) => {
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
};

const postRefreshSuccessResponse = (res, result, device) => {
    const mode = require("@configs/microservice.config").microserviceConfig.enabled ? 'microservice' : 'monolithic';
    
    logWithTime(
        `✅ [${mode.toUpperCase()}] Post-refresh completed for user (${result.userId.substring(0, 8)}...) on device (${device.deviceUUID.substring(0, 8)}...)`
    );

    return res.status(OK).json({
        success: true,
        message: "Tokens refreshed successfully",
        accessToken: result.accessToken
    });
};

const internalsSuccessResponses = {
    getUserDetailsAdminSuccessResponse,
    toggleDeviceBlockSuccessResponse,
    getUserSessionsForAdminSuccessResponse,
    getUserSessionsForAdminNoSessionsResponse,
    toggleUserBlockSuccessResponse,
    getUserAuthLogsAdminSuccessResponse,
    postRefreshSuccessResponse
}

module.exports = {
    internalsSuccessResponses
};