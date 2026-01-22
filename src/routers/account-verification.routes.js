// ========== ✅ ACCOUNT VERIFICATION ROUTES ==========

const express = require("express");
const accountVerificationRouter = express.Router();
const { ACCOUNT_VERIFICATION_ROUTES } = require("../configs/uri.config");
const { accountVerificationController } = require("@controllers/account-verification/index");
const { accountVerificationMiddlewares } = require("@middlewares/account-verification/index");
const { authMiddlewares } = require("@middlewares/auth/index");
const { baseMiddlewares } = require("./middleware.gateway.routes");
const { rateLimiters } = require("@rate-limiters/index");
const { commonMiddlewares } = require("@middlewares/common/index");

const {
    RESEND_VERIFICATION_LINK,
    RESEND_VERIFICATION_OTP,
    VERIFY_DEVICE,
    VERIFY_EMAIL,
    VERIFY_PHONE
} = ACCOUNT_VERIFICATION_ROUTES;

// 📌 Resend Verification Link (Email)
accountVerificationRouter.post(RESEND_VERIFICATION_LINK, [
    rateLimiters.resendVerificationLinkRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
], accountVerificationController.resendVerificationLink);

// 📌 Resend Verification OTP (Phone)
accountVerificationRouter.post(RESEND_VERIFICATION_OTP, [
    rateLimiters.resendVerificationOTPsRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
], accountVerificationController.resendVerificationOTP);

// 📌 Verify Email
accountVerificationRouter.post(VERIFY_EMAIL, [
    rateLimiters.verifyEmailRateLimiter,
    ...baseMiddlewares,
    accountVerificationMiddlewares.validateVerificationInput
], accountVerificationController.verifyEmail);

// 📌 Verify Phone
accountVerificationRouter.post(VERIFY_PHONE, [
    rateLimiters.verifyPhoneRateLimiter,
    ...baseMiddlewares,
    accountVerificationMiddlewares.validateVerificationInput
], accountVerificationController.verifyPhone);

// 📌 Verify Device (2FA)
accountVerificationRouter.post(VERIFY_DEVICE, [
    rateLimiters.verifyDeviceRateLimiter,
    ...baseMiddlewares,
    authMiddlewares.authValidatorBody,
    authMiddlewares.ensureUserExists,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive,
    accountVerificationMiddlewares.validateVerificationInput
], accountVerificationController.verifyDevice);

module.exports = {
    accountVerificationRouter
};
