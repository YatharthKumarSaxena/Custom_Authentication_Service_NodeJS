// 📦 Extracting Configured URIs from central config (high maintainability)
const URIS = require("../configs/uri.config");

// 📥 Importing Controllers (logic handlers) and Middleware (security, validations)
const authController = require("../controllers/auth.controllers");
const authMiddleware = require("../middlewares/auth.middleware");
const commonUsedMiddleware = require("../middlewares/commonUsed.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const adminController = require("../controllers/admin.controllers");
const specialRateLimiter = require("../rate-limiters/special-api-rate-limiter");
const generalRateLimiter = require("../rate-limiters/general-api.rate-limiter");

// 🛣️ Destructuring Required URIs for cleaner usage below
const SIGNUP = URIS.AUTH_ROUTES.SIGNUP;
const SIGNIN = URIS.AUTH_ROUTES.SIGNIN;
const SIGNOUT = URIS.AUTH_ROUTES.SIGNOUT;
const SIGNOUT_FROM_SPECIFIC_DEVICE = URIS.AUTH_ROUTES.SIGNOUT_FROM_SPECIFIC_DEVICE;
const BLOCK_USER = URIS.ADMIN_ROUTES.USERS.BLOCK_USER;
const UNBLOCK_USER = URIS.ADMIN_ROUTES.USERS.UNBLOCK_USER;
const DEACTIVATE_USER = URIS.AUTH_ROUTES.DEACTIVATE_USER;
const ACTIVATE_USER = URIS.AUTH_ROUTES.ACTIVATE_USER;
const CHANGE_PASSWORD = URIS.AUTH_ROUTES.CHANGE_PASSWORD;
const GET_USER_AUTH_LOGS =URIS.ADMIN_ROUTES.USERS.GET_USER_AUTH_LOGS;
const CHECK_ACTIVE_SESSIONS = URIS.AUTH_ROUTES.CHECK_ACTIVE_SESSIONS;

// 🚦 Connecting Express app with middleware chains and route handlers
module.exports = (app) => {

    // 👤 Public User Signup Route
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Validates required fields for creating a new user
    // 📌 Controller:
    // - Creates and stores user in DB
    app.post(SIGNUP, [
        commonUsedMiddleware.verifyDeviceField,
        specialRateLimiter.signUpRateLimiter,
        authMiddleware.verifySignUpBody
    ], authController.signUp);

    // 🔐 Public User Signin Route
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Verifies login credentials
    // - Checks if user is blocked or deactivated
    // - Checks User Account is acive
    // 📌 Controller:
    // - Logs user in and returns access token
    app.post(SIGNIN, [
        commonUsedMiddleware.verifyDeviceField,
        specialRateLimiter.signInRateLimiter,
        authMiddleware.verifySignInBody,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive
    ], authController.signIn);

    // 🔓 Public User Signout Route
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
    // - Validates Access token or generate it if Expired
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Validates signout body
    // 📌 Controller:
    // - Logs user out by invalidating session/token
    app.post(SIGNOUT, [
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.signOutRateLimiter,
        authMiddleware.verifySignOutBody
    ], authController.signOut);

    // - Check whether Device provided or not
    // - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
    // - Validates Access token or generate it if Expired
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Check User is already logged out
    // 📌 Controller:
    // - Logs user out by invalidating session/token from Specific Device
    app.post(SIGNOUT_FROM_SPECIFIC_DEVICE,[
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.signOutRateLimiter,
        authMiddleware.verifySignOutBody
    ],authController.signOutFromSpecificDevice);

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
    app.patch(BLOCK_USER, [
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.blockAccountRateLimiter,
        adminMiddleware.verifyAdminBody,
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
    app.patch(UNBLOCK_USER, [
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.unblockAccountRateLimiter,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.unblockUserAccount);

    // ✅ Public User: Activate Own Account
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Ensures user is not blocked
    // - Verifies required credentials in body
    // 📌 Controller:
    // - Activates inactive user account
    app.patch(ACTIVATE_USER, [
        commonUsedMiddleware.verifyDeviceField,
        specialRateLimiter.activateAccountRateLimiter,
        commonUsedMiddleware.isUserBlocked,
        authMiddleware.verifyActivateUserAccountBody
    ], authController.activateUserAccount);

    // 🚫 Public User: Deactivate Own Account
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
    // - Validates Access token or generate it if Expired
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Confirms user is not blocked
    // - Confirms user is active
    // - Validates input body with password + identification
    // 📌 Controller:
    // - Deactivates account and logs user out
    app.patch(DEACTIVATE_USER, [
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.deactivateAccountRateLimiter,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive,
        commonUsedMiddleware.checkUserIsVerified,
        authMiddleware.verifyDeactivateUserAccountBody
    ], authController.deactivateUserAccount);

    // 👤 Authenticated User: Change their own Password
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
    // - Validates Access token or generate it if Expired
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Confirms user is not blocked (e.g. by admin)
    // - Confirms user's account is active (not deactivated/suspended)
    // - Confirms user is Logged in on that device
    // - Checks provided request body is valid 
    // 🛠️ Controller:
    // - Updates the Password of User if it satisfies some constraints
    // - Responds with either a success message + no changes made
    app.patch(CHANGE_PASSWORD,[
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.changePasswordRateLimiter,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive,
        commonUsedMiddleware.checkUserIsVerified,
        authMiddleware.verifyChangePasswordBody
    ],authController.changePassword);

    // 👤 Authenticated User: Provide details of devices to user where he/she is logged in
    // 🔒 Middleware:
    // - Check whether Device provided or not
    // - Validates that Refresh Token Provided or not and is Valid and Access Token is Present or not
    // - Validates Access token or generate it if Expired
    // - Rate Limiter to prevent Server Crash from Heavy API Attacks
    // - Confirms user is not blocked (e.g. by admin)
    // - Confirms user's account is active (not deactivated/suspended)
    // - Confirms user is Logged in on that device
    // 🛠️ Controller:
    // - Provide the user list of active sessions
    app.get(CHECK_ACTIVE_SESSIONS,[
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.getActiveDevicesRateLimiter,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive,
        commonUsedMiddleware.checkUserIsVerified,
    ],authController.getActiveDevices);

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
    app.post(GET_USER_AUTH_LOGS,[
        commonUsedMiddleware.verifyDeviceField,
        commonUsedMiddleware.verifyTokenOwnership,
        commonUsedMiddleware.verifyToken,
        generalRateLimiter.getUserAuthLogsRateLimiter,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ],adminController.getUserAuthLogs);
};
