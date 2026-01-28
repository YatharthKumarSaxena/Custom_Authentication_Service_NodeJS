// ========== ✅ ACCOUNT VERIFICATION ROUTES ==========

const express = require("express");
const accountVerificationRouter = express.Router();
const { ACCOUNT_VERIFICATION_ROUTES } = require("@configs/uri.config");
const { accountVerificationController } = require("@controllers/account-verification/index");
const { accountVerificationMiddlewares } = require("@middlewares/account-verification/index");
const { authMiddlewares } = require("@middlewares/auth/index");
const { baseMiddlewares } = require("./middleware.gateway.routes");
const { rateLimiters } = require("@rate-limiters/index");
const { commonMiddlewares } = require("@middlewares/common/index");

const {
    RESEND_VERIFICATION,
    VERIFY_DEVICE,
    VERIFY_EMAIL,
    VERIFY_PHONE
} = ACCOUNT_VERIFICATION_ROUTES;

// 📌 Resend Verification Link (Email)
accountVerificationRouter.post(RESEND_VERIFICATION, [
    rateLimiters.resendVerificationRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.sanitizeAuthBody,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive,
    accountVerificationMiddlewares.verifyPurposeFieldPresenceMiddleware,
    accountVerificationMiddlewares.verifyPurposeFieldValidationMiddleware
], accountVerificationController.resendVerification);

// 📌 Verify Email
accountVerificationRouter.post(VERIFY_EMAIL, [
    rateLimiters.verifyEmailRateLimiter,
    ...baseMiddlewares,
    accountVerificationMiddlewares.validateVerificationInput,
    accountVerificationMiddlewares.verifyEmailFieldPresenceMiddleware,
    accountVerificationMiddlewares.verifyEmailFieldValidationMiddleware,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive
], accountVerificationController.verifyEmail);

// 📌 Verify Phone
accountVerificationRouter.post(VERIFY_PHONE, [
    rateLimiters.verifyPhoneRateLimiter,
    ...baseMiddlewares,
    accountVerificationMiddlewares.validateVerificationInput,
    accountVerificationMiddlewares.verifyPhoneFieldPresenceMiddleware,
    accountVerificationMiddlewares.verifyPhoneFieldValidationMiddleware,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive
], accountVerificationController.verifyPhone);

// 📌 Verify Device (2FA)
accountVerificationRouter.post(VERIFY_DEVICE, [
    rateLimiters.verifyDeviceRateLimiter,
    ...baseMiddlewares,
    accountVerificationMiddlewares.validateVerificationInput,
    authMiddlewares.sanitizeAuthBody,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive
], accountVerificationController.verifyDevice);

module.exports = {
    accountVerificationRouter
};
