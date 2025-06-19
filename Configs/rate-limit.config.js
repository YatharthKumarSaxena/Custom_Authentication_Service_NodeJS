// 📦 configs/rate-limit.config.js

// You can adjust these limits as per your security policy

module.exports = {
  perDevice: {
    signup: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    }
  },
  perUserAndDevice: {
    signin: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    },
    signout: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
    },
    activateAccount: {
      maxRequests: 5,
      windowMs: 20 * 60 * 1000,
    },
    deactivateAccount: {
      maxRequests: 3,
      windowMs: 30 * 60 * 1000,
    },
    blockUserAccount: {
      maxRequests: 5,
      windowMs: 20 * 60 * 1000,
    },
    unblockUserAccount: {
      maxRequests: 5,
      windowMs: 20 * 60 * 1000,
    },
    changePassword: {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    }
  }
};
