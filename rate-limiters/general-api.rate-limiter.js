const { createRateLimiter } = require("./create-rate-limiter-factory");
const { perUserAndDevice } = require("../configs/rate-limit.config");

/* Factory Design Pattern is used here to create these same logic Rate Limiters */

// ✅ middlewares/rateLimit_signout.js
const signOutRateLimiter = createRateLimiter(perUserAndDevice.signout.maxRequests, perUserAndDevice.signout.windowMs);

// ✅ middlewares/rateLimit_deactivateAccount.js
const deactivateAccountRateLimiter = createRateLimiter(perUserAndDevice.deactivateAccount.maxRequests, perUserAndDevice.deactivateAccount.windowMs);

// ✅ middlewares/rateLimit_blockUserAccount.js
const blockAccountRateLimiter = createRateLimiter(perUserAndDevice.blockUserAccount.maxRequests, perUserAndDevice.blockUserAccount.windowMs);

// ✅ middlewares/rateLimit_unblockUserAccount.js
const unblockAccountRateLimiter = createRateLimiter(perUserAndDevice.unblockUserAccount.maxRequests, perUserAndDevice.unblockUserAccount.windowMs);

// ✅ middlewares/rateLimit_changePassword.js
const changePasswordRateLimiter = createRateLimiter(perUserAndDevice.changePassword.maxRequests, perUserAndDevice.changePassword.windowMs);

module.exports = {
    signOutRateLimiter: signOutRateLimiter,
    blockAccountRateLimiter: blockAccountRateLimiter,
    unblockAccountRateLimiter: unblockAccountRateLimiter,
    deactivateAccountRateLimiter: deactivateAccountRateLimiter,
    changePasswordRateLimiter: changePasswordRateLimiter
}