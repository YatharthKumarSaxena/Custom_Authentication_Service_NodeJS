// ACCOUNT MANAGEMENT ROUTES

const express = require("express");
const accountManagementRouter = express.Router();
const { ACCOUNT_MANAGEMENT_ROUTES } = require("../configs/uri.config");
const { accountManagementControllers } = require("@controllers/account-management/index");
const { accountManagementMiddlewares } = require("@middlewares/account-management/index");
const { baseAuthMiddlewares, authRequestMiddlewares } = require("./middleware.gateway.routes");
const { authMiddlewares } = require("@middlewares/auth/index");
const { rateLimiters } = require("@rate-limiters/index");
const { commonMiddlewares } = require("@middlewares/common/index");

const {
    ACTIVATE_ACCOUNT,
    DEACTIVATE_ACCOUNT,
    ENABLE_2FA,
    DISABLE_2FA,
    UPDATE_ACCOUNT_DETAILS,
    CHANGE_PASSWORD
} = ACCOUNT_MANAGEMENT_ROUTES;

// Activate Account
accountManagementRouter.post(ACTIVATE_ACCOUNT, [
    rateLimiters.activateAccountRateLimiter,
    ...authRequestMiddlewares,
    commonMiddlewares.isUserAccountBlocked,
    accountManagementMiddlewares.activateAccountFieldPresenceMiddleware
], accountManagementControllers.activateMyAccount);

// Deactivate Account
accountManagementRouter.post(DEACTIVATE_ACCOUNT, [
    rateLimiters.deactivateAccountRateLimiter,
    ...baseAuthMiddlewares,
    accountManagementMiddlewares.deactivateAccountFieldPresenceMiddleware
], accountManagementControllers.deactivateMyAccount);

// Enable 2FA
accountManagementRouter.post(ENABLE_2FA, [
    rateLimiters.enable2FARateLimiter,
    ...baseAuthMiddlewares,
    accountManagementMiddlewares.handle2FAFieldPresenceMiddleware
], accountManagementControllers.enable2FA);

// Disable 2FA
accountManagementRouter.post(DISABLE_2FA, [
    rateLimiters.disable2FARateLimiter,
    ...baseAuthMiddlewares,
    accountManagementMiddlewares.handle2FAFieldPresenceMiddleware
], accountManagementControllers.disable2FA);

// Update Account Details
accountManagementRouter.patch(UPDATE_ACCOUNT_DETAILS, [
    rateLimiters.updateMyAccountRateLimiter,
    ...baseAuthMiddlewares,
    authMiddlewares.sanitizeAuthBody,
], accountManagementControllers.updateMyAccount);

// Change Password
accountManagementRouter.post(CHANGE_PASSWORD, [
    rateLimiters.changePasswordRateLimiter,
    ...baseAuthMiddlewares,
    accountManagementMiddlewares.changePasswordFieldPresenceMiddleware,
    accountManagementMiddlewares.changePasswordFieldValidationMiddleware
], accountManagementControllers.changePassword);

module.exports = {
    accountManagementRouter
};
