// Extracting Required Configurations
const URIS = require("../Configs/uri.config");

// Extracting Controller and Middleware Module
const authController = require("../Controllers/auth.controllers");
const authMiddleware = require("../Middlewares/auth.middleware");

// Connecting Router to Middleware
module.exports = (app)=> {
    app.post(URIS.USER_SIGNUP_URI,[authMiddleware.verifySignUpBody],authController.signUp);
}