// ========== 🔐 AUTHENTICATION ROUTES ==========

const express = require("express");
const authRouter = express.Router();
const { AUTH_ROUTES } = require("../configs/uri.config");
const { authController } = require("@controllers/auth/index");
const { authMiddlewares } = require("@middlewares/auth/index");
const { baseAuthMiddlewares, baseMiddlewares } = require("./middleware.gateway.routes");
const { rateLimiters } = require("@rate-limiters/index");
const { commonMiddlewares } = require("@middlewares/common/index");

const {
    SIGNUP, SIGNIN, SIGNOUT, SIGNOUT_FROM_SPECIFIC_DEVICE,
    GET_ACTIVE_SESSIONS, GET_MY_ACCOUNT_DETAILS, GET_MY_AUTH_LOGS
} = AUTH_ROUTES;

// 📌 User Sign Up
authRouter.post(SIGNUP, [
    rateLimiters.signUpRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserNew,
    authMiddlewares.firstNameValidator,
    authMiddlewares.signupFieldPresenceMiddleware,
    authMiddlewares.signupFieldValidationMiddleware
], authController.signUp);

// 📌 User Sign In
authRouter.post(SIGNIN, [
    rateLimiters.signInRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive,
    commonMiddlewares.checkUserIsVerified,
    authMiddlewares.signinFieldPresenceMiddleware
], authController.signIn);

// 📌 User Sign Out (Current Device)
authRouter.post(SIGNOUT, [
    rateLimiters.signOutRateLimiter,
    ...baseAuthMiddlewares
], authController.signOutAllDevices);

// 📌 User Sign Out From Specific Device
authRouter.post(SIGNOUT_FROM_SPECIFIC_DEVICE, [
    rateLimiters.signOutDeviceRateLimiter,
    ...baseAuthMiddlewares
], authController.signOut);

// 📌 Get Active Sessions
authRouter.get(GET_ACTIVE_SESSIONS, [
    rateLimiters.getMyActiveDevicesRateLimiter,
    ...baseAuthMiddlewares
], authController.getMyActiveSessions);

// 📌 Get My Account Details
authRouter.get(GET_MY_ACCOUNT_DETAILS, [
    rateLimiters.getMyAccountRateLimiter,
    ...baseAuthMiddlewares
], authController.getMyAccount);

// 📌 Get My Auth Logs
authRouter.get(GET_MY_AUTH_LOGS, [
    rateLimiters.getUserAuthLogsRateLimiter,
    ...baseAuthMiddlewares
], authController.getMyAuthLogs);

module.exports = {
    authRouter
};