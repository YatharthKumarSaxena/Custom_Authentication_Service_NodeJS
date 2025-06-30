// ========== 👑 ADMIN PANEL ROUTES ==========


const express = require("express");
const router = express.Router();
const URIS = require("../configs/uri.config");
const adminController = require("../controllers/admin.controllers");
const commonUsedMiddleware = require("../middlewares/common-used.middleware");
const internalMiddleware = require("../middlewares/internal.api.middleware");
const generalLimiter = require("../rate-limiters/general-api.rate-limiter");
const adminMiddleware = require("../middlewares/admin.middleware");
const internalController = require("../controllers/internal-api.controllers");
// 🔹 Middleware: Body Parser - THIS MUST BE BEFORE ROUTES
const bodyParser = express.json();  // Converts the JSON Object Requests into JavaScript Object

const {
  BLOCK_USER, UNBLOCK_USER,
  GET_USER_ACTIVE_SESSIONS, FETCH_USER_DETAILS
} = URIS.ADMIN_ROUTES.USERS;

const { GET_TOTAL_REGISTERED_USERS, GET_USER_AUTH_LOGS } = URIS.ADMIN_ROUTES.STATISTICS;

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
  bodyParser,
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.blockAccountRateLimiter,
  adminMiddleware.verifyAdminBlockUnblockBody,
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
  bodyParser,
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.unblockAccountRateLimiter,
  adminMiddleware.verifyAdminBlockUnblockBody,
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
// - Confirms Authorized User Details are asked with valid reason
// - Confirms user is Logged in on that device
// 🛠️ Controller:
// - Fetches the User Auth Logs based on filter provided by the admin
router.post(GET_USER_AUTH_LOGS, [
  bodyParser,
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.getUserAuthLogsRateLimiter,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified
], adminController.getUserAuthLogs);

// 🛡️ Admin Only: Get Any User's Account Details
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms the requester is an admin (role check)
// - Confirms Authorized User Details are asked with valid reason 
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
  internalMiddleware.verifyAdminUserViewRequest,
  commonUsedMiddleware.checkUserIsVerified,
], adminController.checkUserAccountStatus);

// 🛡️ Admin Only: Provide details of devices of user to admin where he/she is logged in
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms the requester is an admin (role check)
// - Confirms Authorized User Details are asked with valid reason 
// - Confirms user is Logged in on that device
// 🛠️ Controller:
// - Provide the user list of active sessions
router.get(GET_USER_ACTIVE_SESSIONS, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  generalLimiter.checkUserDeviceSessionsRateLimiter,
  commonUsedMiddleware.isAdmin,
  internalMiddleware.verifyAdminUserViewRequest,
  commonUsedMiddleware.checkUserIsVerified
], adminController.getUserActiveDevicesForAdmin);

// 🛡️ Admin Only: Provide details of devices of user to admin where he/she is logged in
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms the requester is an admin (role check)
// - Confirms user is Logged in on that device
// 🛠️ Controller:
// - Provide the total number of registered users and type of users count
router.get(GET_TOTAL_REGISTERED_USERS, [
  commonUsedMiddleware.verifyDeviceField,
  commonUsedMiddleware.verifyTokenOwnership,
  commonUsedMiddleware.verifyToken,
  commonUsedMiddleware.isAdmin,
  commonUsedMiddleware.checkUserIsVerified
], internalController.getTotalRegisteredUsers);

module.exports = router;
