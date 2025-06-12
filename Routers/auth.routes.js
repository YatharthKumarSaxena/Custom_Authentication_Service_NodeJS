// 📦 Extracting Configured URIs from central config (high maintainability)
const URIS = require("../Configs/uri.config");

// 📥 Importing Controllers (logic handlers) and Middleware (security, validations)
const authController = require("../Controllers/auth.controllers");
const authMiddleware = require("../Middlewares/auth.middleware");
const commonUsedMiddleware = require("../Middlewares/commonUsed.middleware");
const adminMiddleware = require("../Middlewares/admin.middleware");
const adminController = require("../Controllers/admin.controllers");

// 🛣️ Destructuring Required URIs for cleaner usage below
const SIGNUP = URIS.AUTH_ROUTES.SIGNUP;
const SIGNIN = URIS.AUTH_ROUTES.SIGNIN;
const SIGNOUT = URIS.AUTH_ROUTES.SIGNOUT;
const BLOCK_USER = URIS.AUTH_ROUTES.BLOCK_USER;
const UNBLOCK_USER = URIS.AUTH_ROUTES.UNBLOCK_USER;
const DEACTIVATE_USER = URIS.AUTH_ROUTES.DEACTIVATE_USER;
const ACTIVATE_USER = URIS.AUTH_ROUTES.ACTIVATE_USER;

// 🚦 Connecting Express app with middleware chains and route handlers
module.exports = (app)=> {
        
    // 👤 Public User Signup Route
    // Middleware: Validate request body
    // Controller: Creates new user
    app.post(SIGNUP, [authMiddleware.verifySignUpBody], authController.signUp);

    // 🔐 Public User Signin Route
    // Middleware: Validate login input + check if user is blocked
    // Controller: Logs user in and returns token
    app.post(SIGNIN, [
        authMiddleware.verifySignInBody,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive
    ], authController.signIn);

    // 🔓 Public User Signout Route
    // Middleware: Validate logout input
    // Controller: Logs out user
    app.post(SIGNOUT, [
        commonUsedMiddleware.verifyToken,
        authMiddleware.verifySignOutBody
    ], authController.signOut);

    // 🚫 Admin Only: Block a user account
    // Middleware Chain:
    // - validate token
    // - check admin-specific data
    // - check if user is an admin
    // - verify admin's account is not blocked/deactivated
    // Controller: Admin blocks another user
    app.patch(BLOCK_USER, [
        commonUsedMiddleware.verifyToken,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.blockUserAccount);

    // ✅ Admin Only: Unblock a user account
    // Middleware chain same as block user
    // Controller: Admin unblocks the user
    app.patch(UNBLOCK_USER, [
        commonUsedMiddleware.verifyToken,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.unblockUserAccount);

    // ✅ Public User: Activate own account
    // Middleware Chain:
    // - check if user is currently blocked (blocked users cannot activate)
    // - validate input body (userID/email/phone + password, and user must be inactive)
    // Controller: Activates the user’s account
    app.patch(ACTIVATE_USER,[
        commonUsedMiddleware.isUserBlocked,
        authMiddleware.verifyActivateUserAccountBody
    ],authController.activateUserAccount)

    // 🚫 Public User: Deactivate own account
    // Middleware Chain:
    // - validate token (ensure user is logged in)
    // - check if user is blocked (blocked users cannot deactivate)
    // - check if user account is active (decativate user account cannot deactivate account again)
    // - ensure user is verified (session is valid)
    // - validate input body (userID/email/phone + password, and user must be active)
    // Controller: Deactivates the user’s account and forcibly logs them out  
    app.patch(DEACTIVATE_USER,[
        commonUsedMiddleware.verifyToken,
        commonUsedMiddleware.isUserBlocked,
        commonUsedMiddleware.isUserAccountActive,
        commonUsedMiddleware.checkUserIsVerified,
        authMiddleware.verifyDeactivateUserAccountBody
    ],authController.deactivateUserAccount) 
};