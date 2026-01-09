const { perDevice } = require("../configs/rate-limit.config")
const {  createDeviceBasedRateLimiter } = require("./create-rate-limiter-factory");

/* Factory Design Pattern is used here to create these same logic Rate Limiters */

// ✅ middlewares/rateLimit_signup.js
const signUpRateLimiter = createDeviceBasedRateLimiter(perDevice.signup.maxRequests, perDevice.signup.windowMs)

// ✅ middlewares/rateLimit_signin.js
const signInRateLimiter = createDeviceBasedRateLimiter(perDevice.signin.maxRequests, perDevice.signin.windowMs); 

// ✅ middlewares/rateLimit_activateAccount.js
const activateAccountRateLimiter = createDeviceBasedRateLimiter(perDevice.activateAccount.maxRequests, perDevice.activateAccount.windowMs);

// ✅ Malformed And Wrong Requests/rateLimit_activateAccount.js
const malformedAndWrongRequestRateLimiter = createDeviceBasedRateLimiter(3, 15_000); // ⏳ 3 requests every 15 sec

module.exports = {
    signUpRateLimiter: signUpRateLimiter,
    signInRateLimiter: signInRateLimiter,
    activateAccountRateLimiter: activateAccountRateLimiter,
    malformedAndWrongRequestRateLimiter: malformedAndWrongRequestRateLimiter
}
