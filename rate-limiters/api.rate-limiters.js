const { createRateLimiter } = require("./create-rate-limiter-factory");
const { perUserAndDevice } = require("../configs/rate-limit.config");

// ✅ middlewares/rateLimit_signin.js
const signInRateLimiter = createRateLimiter(perUserAndDevice.signin.maxRequests, perUserAndDevice.signin.windowMs); 

// ✅ middlewares/rateLimit_signout.js
const signOutRateLimiter = createRateLimiter(perUserAndDevice.signout.maxRequests, perUserAndDevice.signout.windowMs);

// ✅ middlewares/rateLimit_activateAccount.js
const activateAccountRateLimiter = createRateLimiter(perUserAndDevice.activateAccount.maxRequests, perUserAndDevice.activateAccount.windowMs);

// ✅ middlewares/rateLimit_deactivateAccount.js
const deactivateAccountRateLimiter = createRateLimiter(perUserAndDevice.deactivateAccount.maxRequests, perUserAndDevice.deactivateAccount.windowMs);

// ✅ middlewares/rateLimit_blockUserAccount.js
const blockAccountRateLimiter = createRateLimiter(perUserAndDevice.blockUserAccount.maxRequests, perUserAndDevice.blockUserAccount.windowMs);

// ✅ middlewares/rateLimit_unblockUserAccount.js
const unblockAccountRateLimiter = createRateLimiter(perUserAndDevice.unblockUserAccount.maxRequests, perUserAndDevice.unblockUserAccount.windowMs);

// ✅ middlewares/rateLimit_changePassword.js
const changePasswordRateLimiter = createRateLimiter(perUserAndDevice.changePassword.maxRequests, perUserAndDevice.changePassword.windowMs);

module.exports = {
    signInRateLimiter: signInRateLimiter,
    signOutRateLimiter: signOutRateLimiter,
    blockAccountRateLimiter: blockAccountRateLimiter,
    unblockAccountRateLimiter: unblockAccountRateLimiter,
    activateAccountRateLimiter: activateAccountRateLimiter,
    deactivateAccountRateLimiter: deactivateAccountRateLimiter,
    changePasswordRateLimiter: changePasswordRateLimiter
}