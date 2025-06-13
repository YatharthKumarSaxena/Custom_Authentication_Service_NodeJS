// 📦 Extracting Configured URIs from central config (high maintainability)
const URIS = require("../Configs/uri.config");

// 📥 Importing Controllers (logic handlers) and Middleware (security, validations)
const authController = require("../Controllers/auth.controllers");
const authMiddleware = require("../Middlewares/auth.middleware");
const commonUsedMiddleware = require("../Middlewares/commonUsed.middleware");
const adminMiddleware = require("../Middlewares/admin.middleware");
const adminController = require("../Controllers/admin.controllers");
const userController = require("../Controllers/user.controllers");

// 🛣️ Destructuring Required URIs for cleaner usage below
const SIGNUP = URIS.AUTH_ROUTES.SIGNUP;
const SIGNIN = URIS.AUTH_ROUTES.SIGNIN;
const SIGNOUT = URIS.AUTH_ROUTES.SIGNOUT;
const BLOCK_USER = URIS.AUTH_ROUTES.BLOCK_USER;
const UNBLOCK_USER = URIS.AUTH_ROUTES.UNBLOCK_USER;
const DEACTIVATE_USER = URIS.AUTH_ROUTES.DEACTIVATE_USER;
const ACTIVATE_USER = URIS.AUTH_ROUTES.ACTIVATE_USER;
const GET_USER_ACCOUNT_DETAILS = URIS.AUTH_ROUTES.FETCH_USER_DETAILS;
const FETCH_USER_DETAILS_BY_ADMIN = URIS.ADMIN_ROUTES

// 🚦 Connecting Express app with middleware chains and route handlers
module.exports = (app) => {

    // 👤 Public User Signup Route
    // 🔒 Middleware:
    // - Validates required fields for creating a new user
    // 📌 Controller:
    // - Creates and stores user in DB
    app.post(SIGNUP, [authMiddleware.verifySignUpBody], authController.signUp);

    // 🔐 Public User Signin Route
    // 🔒 Middleware:
    // - Verifies login credentials
    // - Checks if user is blocked or deactivated
    // 📌 Controller:
    // - Logs user in and returns access token
    app.post(SIGNIN, [
        authMiddleware.verifySignInBody,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive
    ], authController.signIn);

    // 🔓 Public User Signout Route
    // 🔒 Middleware:
    // - Validates token
    // - Verifies userID in token and request match
    // - Validates signout body
    // 📌 Controller:
    // - Logs user out by invalidating session/token
    app.post(SIGNOUT, [
        commonUsedMiddleware.verifyToken,
        commonUsedMiddleware.validateUserIDMatch,
        authMiddleware.verifySignOutBody
    ], authController.signOut);

    // 🚫 Admin Only: Block User Account
    // 🔒 Middleware:
    // - Validates token
    // - Validates userID match
    // - Verifies admin identity from request body
    // - Confirms requester is an admin
    // - Ensures admin is verified
    // 📌 Controller:
    // - Blocks another user’s account
    app.patch(BLOCK_USER, [
        commonUsedMiddleware.verifyToken,
        commonUsedMiddleware.validateUserIDMatch,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.blockUserAccount);

    // ✅ Admin Only: Unblock User Account
    // 🔒 Middleware: (same as block user)
    // - Ensures only authorized verified admins can unblock users
    // 📌 Controller:
    // - Unblocks the specified user
    app.patch(UNBLOCK_USER, [
        commonUsedMiddleware.verifyToken,
        commonUsedMiddleware.validateUserIDMatch,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.unblockUserAccount);

    // ✅ Public User: Activate Own Account
    // 🔒 Middleware:
    // - Ensures user is not blocked
    // - Verifies required credentials in body
    // 📌 Controller:
    // - Activates inactive user account
    app.patch(ACTIVATE_USER, [
        commonUsedMiddleware.isUserBlocked,
        authMiddleware.verifyActivateUserAccountBody
    ], authController.activateUserAccount);

    // 🚫 Public User: Deactivate Own Account
    // 🔒 Middleware:
    // - Validates token and userID
    // - Checks if account is already active and not blocked
    // - Ensures user is verified
    // - Validates input body with password + identification
    // 📌 Controller:
    // - Deactivates account and logs user out
    app.patch(DEACTIVATE_USER, [
        commonUsedMiddleware.verifyToken,
        commonUsedMiddleware.validateUserIDMatch,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive,
        commonUsedMiddleware.checkUserIsVerified,
        authMiddleware.verifyDeactivateUserAccountBody
    ], authController.deactivateUserAccount);

    // 📄 Public User: Get Own Account Details
    // 🔒 Middleware:
    // - Validates token
    // - Confirms user is not blocked
    // - Confirms user is active
    // - Confirms user is verified
    // 📌 Controller:
    // - Returns full account details of the logged-in user
    app.get(GET_USER_ACCOUNT_DETAILS, [
        commonUsedMiddleware.verifyToken,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive,
        commonUsedMiddleware.checkUserIsVerified
    ], userController.provideUserDetails);


};
