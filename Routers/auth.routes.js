// Extracting Required Configurations
const URIS = require("../Configs/uri.config")

// Extracting Controller Module
const authController = require("../Controllers/auth.controllers");

// Connecting Router to Controller
module.exports = (app)=> {
    app.post(URIS.USER_SIGNUP_URI,authController.signUp);
}