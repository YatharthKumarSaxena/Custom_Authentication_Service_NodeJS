// ========== 🔑 PASSWORD MANAGEMENT ROUTES ==========

const express = require("express");
const passwordManagementRouter = express.Router();
const { PASSWORD_MANAGEMENT_ROUTES } = require("../configs/uri.config");
const { passwordManagementController } = require("@controllers/password-management/index");
const { passwordManagementMiddlewares } = require("@middlewares/password-management/index");
const { authMiddlewares } = require("@middlewares/auth/index");
const { accountVerificationMiddlewares } = require("@middlewares/account-verification/index");
const { baseMiddlewares } = require("./middleware.gateway.routes");
const { rateLimiters } = require("@rate-limiters/index");

const {
    FORGOT_PASSWORD,
    RESET_PASSWORD
} = PASSWORD_MANAGEMENT_ROUTES;

// 📌 Forgot Password (Send OTP/Link)
passwordManagementRouter.post(FORGOT_PASSWORD, [
    rateLimiters.forgetPasswordRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists
], passwordManagementController.forgotPassword);

// 📌 Reset Password (Verify OTP/Token & Change Password)
passwordManagementRouter.post(RESET_PASSWORD, [
    rateLimiters.resetPasswordRateLimiter,
    ...baseMiddlewares,
    accountVerificationMiddlewares.validateVerificationInput,
    passwordManagementMiddlewares.resetPasswordFieldPresenceMiddleware,
    passwordManagementMiddlewares.resetPasswordFieldValidationMiddleware
], passwordManagementController.resetPassword);

module.exports = {
    passwordManagementRouter
};
