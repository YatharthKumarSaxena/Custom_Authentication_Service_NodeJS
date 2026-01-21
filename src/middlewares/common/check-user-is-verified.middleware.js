const { authMode } = require("@configs/security.config");
const { AuthModes } = require("@configs/enums.config");
const {
  logMiddlewareError,
  throwInternalServerError,
  throwAccessDeniedError
} = require("@utils/error-handler.util");
const { logWithTime } = require("@/utils/time-stamps.util");

const checkUserIsVerified = (req, res, next) => {
  try {
    const user = req.user || req.foundUser;

    // ---------------- EMAIL MODE ----------------
    if (authMode === AuthModes.EMAIL) {
      if (!user.isEmailVerified) {
        logMiddlewareError("checkUserIsVerified", "Email not verified.", req);
        return throwAccessDeniedError(res, "Email is not verified.");
      }
    }

    // ---------------- PHONE MODE ----------------
    if (authMode === AuthModes.PHONE) {
      if (!user.isPhoneVerified) {
        logMiddlewareError("checkUserIsVerified", "Phone not verified.", req);
        return throwAccessDeniedError(res, "Phone number is not verified.");
      }
    }

    // ---------------- BOTH MODE ----------------
    if (authMode === AuthModes.BOTH) {
      const emailVerified = user.isEmailVerified;
      const phoneVerified = user.isPhoneVerified;

      if (!emailVerified && !phoneVerified) {
        logMiddlewareError(
          "checkUserIsVerified",
          "Both email and phone are not verified.",
          req
        );
        return throwAccessDeniedError(
          res,
          "Both email and phone number must be verified."
        );
      }

      if (!emailVerified) {
        logMiddlewareError(
          "checkUserIsVerified",
          "Email not verified.",
          req
        );
        return throwAccessDeniedError(res, "Email is not verified.");
      }

      if (!phoneVerified) {
        logMiddlewareError(
          "checkUserIsVerified",
          "Phone not verified.",
          req
        );
        return throwAccessDeniedError(res, "Phone number is not verified.");
      }
    }

    // ---------------- EITHER MODE ----------------
    if (authMode === AuthModes.EITHER) {
      if (!user.isEmailVerified && !user.isPhoneVerified) {
        logMiddlewareError(
          "checkUserIsVerified",
          "Neither email nor phone verified.",
          req
        );
        return throwAccessDeniedError(
          res,
          "Either email or phone number must be verified."
        );
      }
    }

    logWithTime("✅ User verification check passed.");
    return next();

  } catch (error) {
    logMiddlewareError("checkUserIsVerified", "Internal server error occurred", req);
    return throwInternalServerError(res);
  }
};

module.exports = { checkUserIsVerified };
