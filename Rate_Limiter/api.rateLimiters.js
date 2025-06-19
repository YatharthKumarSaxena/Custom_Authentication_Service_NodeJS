const { createRateLimiter } = require("./createRateLimiterFactory");

// ✅ middlewares/rateLimit_signin.js
const signInRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 per 15 mins

// ✅ middlewares/rateLimit_signout.js
const signOutRateLimiter = createRateLimiter(10, 15 * 60 * 1000); // 10 per 15 mins

// ✅ middlewares/rateLimit_activateAccount.js
const activateAccountRateLimiter = createRateLimiter(5, 20 * 60 * 1000);

// ✅ middlewares/rateLimit_deactivateAccount.js
const deactivateAccountRateLimiter = createRateLimiter(3, 30 * 60 * 1000);

// ✅ middlewares/rateLimit_blockUserAccount.js
const blockAccountRateLimiter = createRateLimiter(5, 20 * 60 * 1000);

// ✅ middlewares/rateLimit_unblockUserAccount.js
const unblockAccountRateLimiter = createRateLimiter(5, 20 * 60 * 1000);

// ✅ middlewares/rateLimit_changePassword.js
const changePasswordRateLimiter = createRateLimiter(3, 60 * 60 * 1000);

module.exports = {
    signInRateLimiter: signInRateLimiter,
    signOutRateLimiter: signOutRateLimiter,
    blockAccountRateLimiter: blockAccountRateLimiter,
    unblockAccountRateLimiter: unblockAccountRateLimiter,
    activateAccountRateLimiter: activateAccountRateLimiter,
    deactivateAccountRateLimiter: deactivateAccountRateLimiter,
    changePasswordRateLimiter: changePasswordRateLimiter
}