const { perDevice } = require("../configs/rate-limit.config")
const {  createDeviceBasedRateLimiter } = require("./create-rate-limiter-factory");

/* Factory Design Pattern is used here to create these same logic Rate Limiters */

// ✅ middlewares/rateLimit_signup.js
const signUpRateLimiter = createDeviceBasedRateLimiter(perDevice.signup.maxAttempts, perDevice.signup.windowMs)

// ✅ middlewares/rateLimit_signin.js
const signInRateLimiter = createDeviceBasedRateLimiter(perDevice.signin.maxRequests, perDevice.signin.windowMs); 

// ✅ middlewares/rateLimit_activateAccount.js
const activateAccountRateLimiter = createDeviceBasedRateLimiter(perDevice.activateAccount.maxRequests, perDevice.activateAccount.windowMs);

module.exports = {
    signUpRateLimiter: signUpRateLimiter,
    signInRateLimiter: signInRateLimiter,
    activateAccountRateLimiter: activateAccountRateLimiter
}
