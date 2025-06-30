// ========== 👤 USER PROFILE ROUTES ==========


const express = require("express");
const router = express.Router();
const URIS = require("../configs/uri.config");
const generalLimiter = require("../rate-limiters/general-api.rate-limiter");
const internalMiddleware = require("../middlewares/internal.api.middleware");
const commonUsedMiddleware = require("../middlewares/common-used.middleware");
const internalController = require("../controllers/internal-api.controllers");
const authController = require("../controllers/auth.controllers");
// 🔹 Middleware: Body Parser - THIS MUST BE BEFORE ROUTES
const bodyParser = express.json();  // Converts the JSON Object Requests into JavaScript Object

const { FETCH_MY_PROFILE,UPDATE_PROFILE } = URIS.USER_ROUTES;

// 📄 Public User: Get Own Account Details
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms user is not blocked
// - Confirms user is active
// - Confirms user is verified
// 📌 Controller:
// - Returns full account details of the logged-in user
router.get(FETCH_MY_PROFILE, [
    commonUsedMiddleware.verifyDeviceField,
    commonUsedMiddleware.verifyTokenOwnership,
    commonUsedMiddleware.verifyToken,
    generalLimiter.checkMyAccountDetailsRateLimiter,
    commonUsedMiddleware.isUserBlocked,
    commonUsedMiddleware.isUserAccountActive,
    commonUsedMiddleware.checkUserIsVerified  
], authController.provideUserAccountDetails);

// 👤 Authenticated User: Update Own Profile Details
// 🔒 Middleware:
// - Check whether Device provided or not
// - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
// - Validates Access token or generate it if Expired
// - Rate Limiter to prevent Server Crash from Heavy API Attacks
// - Confirms user is not blocked (e.g. by admin)
// - Confirms user's account is active (not deactivated/suspended)
// - Confirms user is Logged in on that device
// - Prevents updates to restricted/immutable fields (like userID, userType, etc.)
// 🛠️ Controller:
// - Updates only the allowed and changed fields (name, email, address, etc.)
// - Responds with either a success message + updated fields OR no changes made
router.patch(UPDATE_PROFILE,[
    bodyParser,
    commonUsedMiddleware.verifyDeviceField,
    commonUsedMiddleware.verifyTokenOwnership,
    commonUsedMiddleware.verifyToken,
    generalLimiter.updateUserAccountRateLimiter,
    commonUsedMiddleware.isUserBlocked,
    commonUsedMiddleware.isUserAccountActive,
    commonUsedMiddleware.checkUserIsVerified,
    internalMiddleware.checkUpdateMyProfileRequest
],internalController.updateUserProfile);

module.exports = router;