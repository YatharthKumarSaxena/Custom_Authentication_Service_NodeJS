// ========== 👑 ADMIN PANEL ROUTES ==========


const express = require("express");
const router = express.Router();
const URIS = require("../configs/uri.config");
const adminController = require("../controllers/admin.controllers");
const authController = require("../controllers/auth.controllers");
const admin = require("../middlewares/admin.middleware");
const commonUsedMiddleware = require("../middlewares/common-used.middleware");
const internal = require("../middlewares/internal.api.middleware");
const generalLimiter = require("../rate-limiters/general-api.rate-limiter");

const {
  BLOCK_USER, UNBLOCK_USER, GET_USER_AUTH_LOGS,
  GET_USER_ACTIVE_SESSIONS, FETCH_USER_DETAILS
} = URIS.ADMIN_ROUTES.USERS;

// 🚫 Admin Only: Block User Account
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Verifies admin identity from request body
// - Confirms requester is an admin
// - Ensures admin is verified
// 📌 Controller:
// - Blocks another user’s account
router.patch(BLOCK_USER, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.blockAccountRateLimiter,
  admin.verifyAdminBlockUnblockBody,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified
], adminController.blockUserAccount);

// ✅ Admin Only: Unblock User Account
// 🔒 Middleware: (same as block user)
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Check whether provided request body is valid
// - Ensures only authorized verified admins can unblock users
// - Checks Admin is verified
// 📌 Controller:
// - Unblocks the specified user
router.patch(UNBLOCK_USER, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.unblockAccountRateLimiter,
  admin.verifyAdminBlockUnblockBody,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified
], adminController.unblockUserAccount);

// ✅ Admin Only: Check any user auth logs based on filter 
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms that provided user is Admin or not
// - Confirms user is Logged in on that device
// 🛠️ Controller:
// - Fetches the User Auth Logs based on filter provided by the admin
router.post(GET_USER_AUTH_LOGS, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.getUserAuthLogsRateLimiter,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified
], adminController.getUserAuthLogs);

// ✅ Admin Only: Check any user active device sessions 
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms that provided user is Admin or not
// - Confirms user is Logged in on that device
// 🛠️ Controller:
// - Fetches the User active device sessions based on phone number, email ID or user ID  provided by the admin
router.get(GET_USER_ACTIVE_SESSIONS, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.getActiveDevicesRateLimiter,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified,
  admin.verifyAdminCheckUserSessionsBody
], authController.getActiveDevices);

// 🛡️ Admin Only: Get Any User's Account Details
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms the requester is an admin (role check)
// - Confirms the admin is a verified user (e.g. admin is logout or not)
// - Validates that the admin is requesting valid user data (input format & presence)
// 📌 Controller:
// - Returns full account details of the target user (based on userId provided in query/body)
router.get(FETCH_USER_DETAILS, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.checkUserAccountDetailsRateLimiter,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified,
  internal.verifyAdminUserViewRequest
], adminController.checkUserAccountStatus);

module.exports = router;
