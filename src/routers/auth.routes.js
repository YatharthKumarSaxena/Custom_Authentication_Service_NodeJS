// AUTHENTICATION ROUTES

const express = require("express");
const authRouter = express.Router();
const { AUTH_ROUTES } = require("../configs/uri.config");
const { authController } = require("@controllers/auth/index");
const { authMiddlewares } = require("@middlewares/auth/index");
const { baseAuthMiddlewares, authNewUserMiddlewares, authExistingUserMiddlewares } = require("./middleware.gateway.routes");
const { rateLimiters } = require("@rate-limiters/index");
const { commonMiddlewares } = require("@middlewares/common/index");

const {
    SIGNUP, SIGNIN, SIGNOUT, SIGNOUT_FROM_SPECIFIC_DEVICE,
    GET_ACTIVE_SESSIONS, GET_MY_ACCOUNT_DETAILS, GET_MY_AUTH_LOGS,
    POST_REFRESH
} = AUTH_ROUTES;

// User Sign Up
authRouter.post(SIGNUP, [
    rateLimiters.signUpRateLimiter,
    ...authNewUserMiddlewares,
    authMiddlewares.firstNameValidator,
    authMiddlewares.signupFieldPresenceMiddleware,
    authMiddlewares.signupFieldValidationMiddleware
], authController.signUp);

// User Sign In
authRouter.post(SIGNIN, [
    rateLimiters.signInRateLimiter,
    ...authExistingUserMiddlewares,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive,
    commonMiddlewares.checkUserIsVerified,
    authMiddlewares.signinFieldPresenceMiddleware
], authController.signIn);

// User Sign Out (Current Device)
authRouter.post(SIGNOUT, [
    rateLimiters.signOutRateLimiter,
    ...baseAuthMiddlewares
], authController.signOutAllDevices);

// User Sign Out From Specific Device
authRouter.post(SIGNOUT_FROM_SPECIFIC_DEVICE, [
    rateLimiters.signOutDeviceRateLimiter,
    ...baseAuthMiddlewares
], authController.signOut);

// Get Active Sessions
authRouter.get(GET_ACTIVE_SESSIONS, [
    rateLimiters.getMyActiveDevicesRateLimiter,
    ...baseAuthMiddlewares
], authController.getMyActiveSessions);

// Get My Account Details
authRouter.get(GET_MY_ACCOUNT_DETAILS, [
    rateLimiters.getMyAccountRateLimiter,
    ...baseAuthMiddlewares
], authController.getMyAccount);

// Get My Auth Logs
authRouter.get(GET_MY_AUTH_LOGS, [
    rateLimiters.getUserAuthLogsRateLimiter,
    ...baseAuthMiddlewares
], authController.getMyAuthLogs);

// Post-Refresh Token (Microservice Mode)
authRouter.post(POST_REFRESH, [
    rateLimiters.signInRateLimiter, // Reuse sign-in rate limiter
    ...baseAuthMiddlewares
], authController.postRefresh);

module.exports = {
    authRouter
};