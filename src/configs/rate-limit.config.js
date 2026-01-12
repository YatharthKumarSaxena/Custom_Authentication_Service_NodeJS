// 📦 configs/rate-limit.config.js

module.exports = {
  perDevice: {
    signup: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      prefix: "signup",
      reason: "Signup abuse",
      message: "Too many signup attempts. Please try later."
    },
    signin: {
      maxRequests: 10,
      windowMs: 10 * 60 * 1000,
      prefix: "signin",
      reason: "Signin abuse",
      message: "Too many login attempts."
    },
    forgotPassword: {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      prefix: "forgot_password",
      reason: "Forgot password abuse",
      message: "Too many forgot password attempts."
    },
    activateMyAccount: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      prefix: "activate_my_account",
      reason: "Account activation abuse",
      message: "Too many account activation attempts."
    },
    resetPassword: {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      prefix: "reset_password",
      reason: "Reset password abuse",
      message: "Too many reset password attempts."
    },
    resendVerificationLink: {
      maxRequests: 3,
      windowMs: 15 * 60 * 1000,
      prefix: "resend_verification_link",
      reason: "Resend verification link abuse",
      message: "Too many resend verification link attempts."
    },
    resendVerificationOTPs: {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000,
      prefix: "resend_verification_otps",
      reason: "Resend verification OTP abuse",
      message: "Too many resend verification OTP attempts."
    },
    malformedRequest: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      prefix: "malformed_request",
      reason: "Malformed request",
      message: "Too many malformed requests. Fix your payload and try again later."
    },

    unknownRoute: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      prefix: "unknown_route",
      reason: "Unknown route access",
      message: "Too many invalid or unauthorized requests."
    }

  },


  perUserAndDevice: {
    signout: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      prefix: "signout",
      reason: "Excessive signout attempts",
      message: "Too many signout requests. Please try again later."
    },

    signOutDevice: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      prefix: "signout_device",
      reason: "Excessive device signout attempts",
      message: "Too many device signout requests. Please try again later."
    },

    deactivateMyAccount: {
      maxRequests: 2,
      windowMs: 60 * 60 * 1000,
      prefix: "deactivate_my_account",
      reason: "Account deactivation abuse",
      message: "Too many deactivate account attempts."
    },

    changePassword: {
      maxRequests: 2,
      windowMs: 60 * 60 * 1000,
      prefix: "change_password",
      reason: "Change password abuse",
      message: "Too many password change attempts."
    },

    getMyAuthLogs: {
      maxRequests: 5,
      windowMs: 30 * 60 * 1000,
      prefix: "auth_logs",
      reason: "Auth logs scraping",
      message: "Too many auth log requests."
    },

    getMyActiveDevices: {
      maxRequests: 10,
      windowMs: 20 * 60 * 1000,
      prefix: "my_active_devices",
      reason: "Excessive active device checks",
      message: "Too many device list requests."
    },

    getMyAccount: {
      maxRequests: 10,
      windowMs: 60 * 1000,
      prefix: "get_my_account",
      reason: "Profile fetch abuse",
      message: "Too many profile fetch requests."
    },

    updateMyAccount: {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000,
      prefix: "update_my_account",
      reason: "Profile update abuse",
      message: "Too many profile update attempts."
    }
  }
};
