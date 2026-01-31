const { createRedisDeviceRateLimiter } = require("./create-redis-device.rate-limiter");
const { perDevice } = require("../configs/rate-limit.config")

// middlewares/rateLimit_malformedAndWrongRequest.js
const malformedAndWrongRequestRateLimiter = createRedisDeviceRateLimiter(perDevice.malformedRequest);

// middlewares/rateLimit_unknownRoute.js
const unknownRouteLimiter = createRedisDeviceRateLimiter(perDevice.unknownRoute);

// middlewares/rateLimit_signup.js
const signUpRateLimiter = createRedisDeviceRateLimiter(perDevice.signup)

// middlewares/rateLimit_signin.js
const signInRateLimiter = createRedisDeviceRateLimiter(perDevice.signin);

// middlewares/rateLimit_activateAccount.js
const activateAccountRateLimiter = createRedisDeviceRateLimiter(perDevice.activateMyAccount);

// middlewares/rateLimit_forgetPassword.js
const forgetPasswordRateLimiter = createRedisDeviceRateLimiter(perDevice.forgotPassword);

// middlewares/rateLimit_resetPassword.js
const resetPasswordRateLimiter = createRedisDeviceRateLimiter(perDevice.resetPassword);

// middlewares/rateLimit_resendVerification.js
const resendVerificationRateLimiter = createRedisDeviceRateLimiter(perDevice.resendVerification);

const verifyEmailRateLimiter = createRedisDeviceRateLimiter(perDevice.verifyEmail);

const verifyPhoneRateLimiter = createRedisDeviceRateLimiter(perDevice.verifyPhone);

const verifyDeviceRateLimiter = createRedisDeviceRateLimiter(perDevice.verifyDevice);

const deviceBasedRateLimiters = {
    malformedAndWrongRequestRateLimiter,
    unknownRouteLimiter,
    signUpRateLimiter,
    signInRateLimiter,
    activateAccountRateLimiter,
    forgetPasswordRateLimiter,
    resetPasswordRateLimiter,
    resendVerificationRateLimiter,
    verifyEmailRateLimiter,
    verifyPhoneRateLimiter,
    verifyDeviceRateLimiter
};

module.exports = {
    deviceBasedRateLimiters
};