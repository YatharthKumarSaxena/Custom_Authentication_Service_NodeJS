// 📁 internal-calls/set-admin-refresh-cookie.internal.js

const { logWithTime } = require("../utils/time-stamps.utils");
const { setRefreshCookieForAdmin } = require("../controllers/internal-api.controllers");
const { errorMessage } = require("../configs/error-handler.configs");

/**
 * 🔐 Internal Function: Simulate setting refresh token cookie for Admin user
 * 📦 This function directly invokes the controller logic without HTTP request
 * 
 * @param {Object} user - Admin user object
 * @param {String} refreshToken - Valid JWT refresh token
 */

const callSetAdminRefreshCookie = async (user, refreshToken) => {
  try {
    if (user.userType !== "ADMIN") {
      logWithTime(`⛔ Invalid userType. Refresh cookie not set. userID: (${user.userID})`);
      return;
    }
    logWithTime(`🧪 Internally setting cookie for Admin User ID: (${user.userID})`);

    // Simulated req and res for internal call
    const mockReq = {
      body: { refreshToken },
      user: user,
      deviceID: "LOCAL_INTERNAL_CALL"
    };

    const mockRes = {
      cookie: (name, value, options) => {
        logWithTime(`🍪 Internally Set Cookie: ${name}=${value}`);
      },
      status: (code) => ({
        json: (payload) => logWithTime(`📡 [${code}] ${payload.message}`)
      }),
      headersSent: false
    };

    await setRefreshCookieForAdmin(mockReq, mockRes);
    logWithTime("✅ Internal Admin Cookie Setup Completed.");
    
  } catch (err) {
    logWithTime("❌ Internal Error: Failed to internally set refresh token cookie for Admin.");
    errorMessage(err);
    return;
  }
};

module.exports = {
  callSetAdminRefreshCookie: callSetAdminRefreshCookie
};
