const { createRedisDeviceRateLimiter } = require("./create-redis-device.rate-limiter");
const { perUserAndDevice } = require("../configs/rate-limit.config");

/* Factory Design Pattern is used here to create these same logic Rate Limiters */

// ✅ middlewares/rateLimit_signout.js
const signOutRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.signout);

const signOutDeviceRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.signOutDevice);

// ✅ middlewares/rateLimit_deactivateAccount.js
const deactivateAccountRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.deactivateMyAccount);

// ✅ middlewares/rateLimit_changePassword.js
const changePasswordRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.changePassword);

// ✅ middlewares/rateLimit_getActiveDevices.js
const getMyActiveDevicesRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.getMyActiveDevices);

// ✅ middlewares/rateLimit_getUserAuthLogs.js
const getUserAuthLogsRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.getMyAuthLogs);

// ✅ middlewares/rateLimit_updateUserAccount.js
const updateMyAccountRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.updateMyAccount);

// ✅ middlewares/rateLimit_checkMyAccountDetails.js
const getMyAccountRateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.getMyAccount);

const enable2FARateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.enable2FA);

const disable2FARateLimiter = createRedisDeviceRateLimiter(perUserAndDevice.disable2FA);

const userAndDeviceBasedRateLimiters = {
    signOutRateLimiter,
    deactivateAccountRateLimiter,
    changePasswordRateLimiter,
    getMyActiveDevicesRateLimiter,
    getUserAuthLogsRateLimiter,
    updateMyAccountRateLimiter,
    getMyAccountRateLimiter,
    signOutDeviceRateLimiter,
    enable2FARateLimiter,
    disable2FARateLimiter
};

module.exports = {
    userAndDeviceBasedRateLimiters
}