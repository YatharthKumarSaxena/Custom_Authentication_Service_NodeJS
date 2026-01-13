const { logoutUserCompletelyCore,loginTheUserCore } = require("@utils/auth-session.util");
const { clearRefreshTokenCookie, setRefreshTokenCookie } = require("./auth-cookie-service");
const { logWithTime } = require("@utils/time-stamps.util");

// auth-session.service.js
const logoutUserCompletely = async (user, req, res, context = "general") => {
    const coreLoggedOut = await logoutUserCompletelyCore(user);
    if (!coreLoggedOut) return false;

    const cookieCleared = clearRefreshTokenCookie(res);
    if (!cookieCleared) {
        logWithTime(
            `⚠️ Cookie clear failed for user (${user.userId}) during ${context}. Device ID: (${req.deviceId})`
        );
        return false;
    }

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
    logWithTime(
        `✅ User (${user.userId}) logged in successfully on device (${req.deviceId})`
    );
    return true;
};

module.exports = {
    logoutUserCompletely,
    loginUserOnDevice
};
