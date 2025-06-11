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
        commonUsedMiddleware.isUserBlocked
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
    app.post(BLOCK_USER, [
        commonUsedMiddleware.verifyToken,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.blockUserAccount);

    // ✅ Admin Only: Unblock a user account
    // Middleware chain same as block user
    // Controller: Admin unblocks the user
    app.post(UNBLOCK_USER, [
        commonUsedMiddleware.verifyToken,
        adminMiddleware.verifyAdminBody,
        commonUsedMiddleware.isAdmin,
        commonUsedMiddleware.checkUserIsVerified
    ], adminController.unblockUserAccount);
};