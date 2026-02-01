// AUTH SUCCESS RESPONSES

const { OK, CREATED } = require("@/configs/http-status.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const signUpSuccessResponse = (res, result, deviceInput) => {
    logWithTime(
        `✅ SignUp Initialized: User (${result.userId}) on device (${deviceInput.deviceUUID})`
    );
    return res.status(CREATED).json({
        success: true,
        message: result.message,
        data: {
            userId: result.userId,
            contactMode: result.contactMode,
            nextStep: "VERIFICATION_REQUIRED"
        }
    });
};

const signInTwoFactorRequiredResponse = (res, message) => {
    return res.status(OK).json({
        success: true,
        requires2FA: true,
        message: message
    });
};

const signInSuccessResponse = (res, user, device) => {
    logWithTime(
        `✅ User (${user.userId}) logged in from device (${device.deviceUUID})`
    );
    return res.status(OK).json({
        success: true,
        message: `Welcome ${user.firstName || "User"}, you are logged in successfully.`
    });
};

const refreshTokenSuccessResponse = (res, userId, deviceUUID) => {
    logWithTime(`✅ Token refreshed successfully for user (${userId}) on device (${deviceUUID}).`);
    return res.status(OK).json({
        success: true,
        message: "Token refreshed successfully."
    });
};

const signOutSuccessResponse = (res, user, device, result) => {
    logWithTime(
        `👋 Sign-out processed for User (${user.userId}) on device (${device.deviceUUID})`
    );
    return res.status(OK).json({
        success: true,
        message: result.message,
        sessionExpired: result.sessionExpired || false
    });
};

const signOutAllDevicesSuccessResponse = (res, user, device) => {
    logWithTime(`🔓 User (${user.userId}) successfully logged out from all devices via request from (${device.deviceUUID})`);
    
    const praiseBy = user.firstName || "User";
    
    return res.status(OK).json({
        success: true,
        message: `${praiseBy}, you are successfully logged out from all devices.`
    });
};

const getMyAccountSuccessResponse = (res, userAccountDetails) => {
    return res.status(OK).json({
        success: true,
        message: "Account details fetched successfully.",
        data: userAccountDetails
    });
};

const getMyActiveSessionsSuccessResponse = (res, activeSessions) => {
    return res.status(OK).json({
        success: true,
        message: "Active sessions fetched successfully.",
        activeSessions
    });
};

const getMyAuthLogsSuccessResponse = (res, user, page, result, limit) => {
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
};

const authSuccessResponses = {
    signUpSuccessResponse,
    signInTwoFactorRequiredResponse,
    signInSuccessResponse,
    refreshTokenSuccessResponse,
    signOutSuccessResponse,
    signOutAllDevicesSuccessResponse,
    getMyAccountSuccessResponse,
    getMyActiveSessionsSuccessResponse,
    getMyAuthLogsSuccessResponse
};

module.exports = {
    authSuccessResponses
};