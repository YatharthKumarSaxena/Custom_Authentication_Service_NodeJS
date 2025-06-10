// Extracting Required Configurations
const URIS = require("../Configs/uri.config");

// Extracting Controller and Middleware Module
const authController = require("../Controllers/auth.controllers");
const authMiddleware = require("../Middlewares/auth.middleware");
const commonUsedMiddleware = require("../Middlewares/commonUsed.middleware");
const adminMiddleware = require("../Middlewares/admin.middleware");
const adminController = require("../Controllers/admin.controllers");

// Connecting Router to Middleware
module.exports = (app)=> {
    app.post(URIS.USER_SIGNUP_URI,[authMiddleware.verifySignUpBody],authController.signUp);
    app.post(URIS.USER_SIGNIN_URI,[authMiddleware.verifySignInBody,commonUsedMiddleware.verifyToken],authController.signIn);
    app.post(URIS.BLOCK_USER_URI,[adminMiddleware.verifyAdminBody,commonUsedMiddleware.verifyToken,commonUsedMiddleware.isAdmin],adminController.blockUserAccount);
    app.post(URIS.UNBLOCK_USER_URI,[commonUsedMiddleware.verifyToken,adminMiddleware.verifyAdminBody,commonUsedMiddleware.isAdmin],adminController.unblockUserAccount);
}