const { createRateLimiter } = require("./create-rate-limiter");
const { perUserAndDevice } = require("../configs/rate-limit.config");

/* Factory Design Pattern is used here to create these same logic Rate Limiters */

// ✅ middlewares/rateLimit_signout.js
const signOutRateLimiter = createRateLimiter(perUserAndDevice.signout);

const signOutDeviceRateLimiter = createRateLimiter(perUserAndDevice.signOutDevice);

// ✅ middlewares/rateLimit_deactivateAccount.js
const deactivateAccountRateLimiter = createRateLimiter(perUserAndDevice.deactivateMyAccount);

// ✅ middlewares/rateLimit_changePassword.js
const changePasswordRateLimiter = createRateLimiter(perUserAndDevice.changePassword);

// ✅ middlewares/rateLimit_getActiveDevices.js
const getMyActiveDevicesRateLimiter = createRateLimiter(perUserAndDevice.getMyActiveDevices);

// ✅ middlewares/rateLimit_getUserAuthLogs.js
const getUserAuthLogsRateLimiter = createRateLimiter(perUserAndDevice.getMyAuthLogs);

// ✅ middlewares/rateLimit_updateUserAccount.js
const updateMyAccountRateLimiter = createRateLimiter(perUserAndDevice.updateMyAccount);

// ✅ middlewares/rateLimit_checkMyAccountDetails.js
const getMyAccountRateLimiter = createRateLimiter(perUserAndDevice.getMyAccount);

module.exports = {
    signOutRateLimiter,
    deactivateAccountRateLimiter,
    changePasswordRateLimiter,
    getMyActiveDevicesRateLimiter,
    getUserAuthLogsRateLimiter,
    updateMyAccountRateLimiter,
    getMyAccountRateLimiter,
    signOutDeviceRateLimiter
}