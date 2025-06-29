// 📦 configs/rate-limit.config.js

module.exports = {
  perDevice: {
    activateAccount: {
      maxRequests: 5,               // 5 attempts
      windowMs: 20 * 60 * 1000,     // every 20 minutes
    },
    signin: {
      maxRequests: 5,               // 5 attempts
      windowMs: 15 * 60 * 1000,     // every 15 minutes
    },
    signup: {
      maxRequests: 5,              // limit to 5 registration attempts
      windowMs: 15 * 60 * 1000     // every 15 minutes
    }
  },

  perUserAndDevice: {
    signout: {
      maxRequests: 10,             // Frequent logout is okay
      windowMs: 15 * 60 * 1000     // every 15 minutes
    },
    deactivateAccount: {
      maxRequests: 2,              // Rare action, must protect
      windowMs: 60 * 60 * 1000     // every 1 hour
    },
    blockUserAccount: {
      maxRequests: 3,              // Prevent misuse
      windowMs: 30 * 60 * 1000     // every 30 minutes
    },
    unblockUserAccount: {
      maxRequests: 3,              // Match with block policy
      windowMs: 30 * 60 * 1000     // every 30 minutes
    },
    changePassword: {
      maxRequests: 2,              // Highly sensitive
      windowMs: 60 * 60 * 1000     // every 1 hour
    },
    getUserAuthLogs: {
      maxRequests: 5,              // Not a frequent query
      windowMs: 30 * 60 * 1000     // every 30 minutes
    },
    getActiveDevices: {
      maxRequests: 10,             // Moderate frequency allowed
      windowMs: 20 * 60 * 1000     // every 20 minutes
    },
    fetchMyAccountDetails: {
      maxRequests: 10,
      windowMs: 60 * 1000          // every 1 minute
    },
    fetchUserDetailsByAdmin: {
      maxRequests: 5,
      windowMs: 5 * 60 * 1000      // every 5 minutes
    },
    updateUserProfile: {
      maxRequests: 3,
      windowMs: 10 * 60 * 1000     // every 10 minutes
    },
    checkUserDeviceSessions: {
      maxRequests: 5,
      windowMs: 10 * 60 * 1000     // every 10 minutes
    }
  }
};
