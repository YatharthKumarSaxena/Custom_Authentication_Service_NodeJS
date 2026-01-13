const { logoutUserCompletelyCore,loginTheUserCore } = require("@utils/auth-session.util");
const { clearRefreshTokenCookie, setRefreshTokenCookie } = require("./auth-cookie-service");
const { logWithTime } = require("@utils/time-stamps.util");
const { logAuthEvent } = require("@utils/auth-log-util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");

// auth-session.service.js
const logoutUserCompletely = async (user, req, res, context = "general sign out all devices") => {
    const coreLoggedOut = await logoutUserCompletelyCore(user);
    if (!coreLoggedOut) return false;

    const cookieCleared = clearRefreshTokenCookie(res);
    if (!cookieCleared) {
        logWithTime(
            `⚠️ Cookie clear failed for user (${user.userId}) during ${context}. Device ID: (${req.deviceId})`
        );
        return false;
    }

    logAuthEvent(req, AUTH_LOG_EVENTS.LOGOUT_ALL_DEVICE, `User ID ${user.userId} logged out completely during ${context}.`, null);
    
    logWithTime(
        `👋 User (${user.userId}) fully logged out during ${context}. Device ID: (${req.deviceId})`
    );
    return true;
};

const loginUserOnDevice = async (user, req, res, refreshToken) => {
    const coreLoggedIn = await loginTheUserCore(user, req.deviceId, refreshToken);
    if (!coreLoggedIn) {
        logWithTime(
            `❌ Login failed for user (${user.userId}) on device (${req.deviceId})`
        );
        return false;
    }

    const cookieSet = setRefreshTokenCookie(res, refreshToken);
    if (!cookieSet) {
        logWithTime(
            `⚠️ Cookie set failed for user (${user.userId}) on device (${req.deviceId})`
        );
        return false;
    }

    logAuthEvent(req, AUTH_LOG_EVENTS.LOGIN, `User ID ${user.userId} logged in on device (${req.deviceId}).`, null);
    
    logWithTime(
        `✅ User (${user.userId}) logged in successfully on device (${req.deviceId})`
    );
    return true;
};

module.exports = {
    logoutUserCompletely,
    loginUserOnDevice
};
