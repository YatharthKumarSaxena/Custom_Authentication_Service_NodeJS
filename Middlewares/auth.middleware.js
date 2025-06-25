/* This file is of MiddleWare that will handle request flow between Router and Controller*/ 
/* This file decides whether request from Router must be sent to Controller or not */

// Flow of Request :- 
/* App(Express Server)->Routers->Middlewares->Controllers->Models */
/* If an Error Occured in Middleware then Middleware will throw an Error , Request will not be forwarded to Controller */

// Extracting the Required Modules
const { throwResourceNotFoundError, throwInternalServerError, errorMessage, throwInvalidResourceError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { fetchUser } = require("./helper.middleware");
const { validateSingleIdentifier } = require("../utils/auth.utils");
const { nameRegex, phoneRegex, emailRegex, strongPasswordRegex } = require("../configs/regex.config");
const { checkUserIsNotVerified } = require("../controllers/auth.controllers");
const { nameMinLength, nameMaxLength } = require("../configs/user-enums.config");

const verifySignUpBody = async (req,res,next) =>{
    // Validating the User Request
    try{
        if(!req.body){
            logWithTime(`An Unknown User has provided an empty body for Sign Up from device ID: (${req.deviceID})`);
            return throwResourceNotFoundError(res,"SignUp Body");
        }
        // Check name is present in Request Body or not
        let userIsValid = true; // Assuming that Request Provided is correct
        let reason = ""; // Stores Reason for Invalid Request
        // Check if Name Field Provided Is It Valid Or Not
        if(typeof req.body.name === 'string' && req.body.name.trim().length){
            const name = req.body.name.trim();
            if (name.length < nameMinLength || name.length > nameMaxLength){
                return throwInvalidResourceError(res,"Invalid Name Provided, Name must be of minimum 2 letters or maximum 50 letters");
            }
            if(!nameRegex.test(name)){
                return throwInvalidResourceError(res,"Name can only include letters, spaces, apostrophes ('), periods (.), and hyphens (-).");
            }
        }
        // Check Email ID is present in Request Body or not
        if(!req.body.emailID){
            if(userIsValid)reason = reason+"Email ID";
            else reason = reason+", Email ID";
            userIsValid = false;
        }
        // Check Phone Number is present in Request Body or not
        if(!req.body.phoneNumber){
            if(userIsValid)reason = reason+"Phone Number";
            else reason = reason+" ,Phone Number";
            userIsValid = false;
        }
        if(!req.deviceID){
            if(userIsValid)reason = reason+"Device Information";
            else reason = reason+" , Device Information";
            userIsValid = false;           
        }
         // Check Password is present in Request Body or not
        if(!req.body.password){
            if(userIsValid)reason = reason+"Password";
            else reason = reason+" and Password";
            userIsValid = false;
        } else {
            // ✅ Move these two checks inside the "else" of password
            if (req.body.password.length < 8) {
                return throwInvalidResourceError(res, "Password must be at least 8 characters long");
            }
            if (!strongPasswordRegex.test(req.body.password)) {
                return throwInvalidResourceError(
                    res,
                    "Password must contain at least one letter, one number, and one special character",
                );
            }
        }
        if(!userIsValid){ // Throw Error as User Details are not properly given
            return throwResourceNotFoundError(res,reason);
        }
        // 📧 Phone Number Format Validation
        if (!phoneRegex.test(req.body.phoneNumber)) {
            return throwInvalidResourceError(
                res,
                "Phone Number must contain exactly 10 Numeric Digits",
            );
        }
        // 📧 Email Format Validation
        if (!emailRegex.test(req.body.emailID)) {
            return throwInvalidResourceError(res, "Email ID format is invalid. It should have:- 🔹 Have no spaces,🔹 Contain exactly one @,🔹 Include a valid domain like .com, .in, etc.");
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while verifying the Sign up Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifySignInBody = async (req,res,next) =>{
    // Validating the User SignIn Body
    try{
        if(!req.body){
            logWithTime(`An Unknown User has provided an empty body for Sign In from device ID: (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Body");
        }
        if(!req.body.password){
            return throwResourceNotFoundError(res,"Password");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`Login Request Cancelled for Unknown User from device ID: (${req.deviceID})`)
            return;
        }
        req.user = req.foundUser;
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while verifying the Sign in Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifySignOutBody = async (req,res,next) => {
    // Validating the User SignOut Body
    try{
        // ✅ Now Check if User is Already Logged Out 
        const isNotVerified = await checkUserIsNotVerified(req,res);
        if (isNotVerified) {
            logWithTime(`🚫 Logout Request Denied: User (${req.user.userID}) is already logged out from device ID: (${req.deviceID})`);
            return res.status(409).json({
                success: false,
                message: "User is already logged out.",
                suggestion: "Please login first before trying to logout again."
            });
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while verifying the Sign out Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyActivateUserAccountBody = async(req,res,next) => {
    // Validating Request Body
    try{
        if(!req.body){
            logWithTime(`An Unknown User has provided an empty body to Activate Account from device ID: (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Body");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`Activate Account with id: (${req.user.userID}) Request Cancelled. Request is done from (${req.deviceID})`);
            return;
        }
        if(req.foundUser.userType === "ADMIN"){
            logWithTime(`🚫 Request Denied: Admin account with id: (${req.user.userID}) cannot be activated. Admin tried to do it from device ID: (${req.deviceID}).`);
            return res.status(403).json({
                success: false,
                message: "Admin account cannot be activated.",
                reason: "Admin is a system-level user and cannot be modified like a normal user."
            });
        }
        if(!req.body.password){
            return throwResourceNotFoundError(res,"Password");
        }
        const user = req.foundUser;
        if(user.isActive === true){
            logWithTime(`🚫 User Account Activation Request Denied: User Account of User (${user.userID}) is already Active from device ID: (${req.deviceID}).`);
            return res.status(400).json({
                success: false,
                message: "User Account is already Active.",
                suggestion: "Please deactivate your account first before trying to activate again."
            });
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while verifying the Activate Account Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyDeactivateUserAccountBody = async(req,res,next) => {
    // Validating Request Body
    try{
        if(!req.body){
            logWithTime(`An Unknown User has provided an empty body to Deactivate Account from device ID: (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Body");
        }
        const user = req.user;
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        if(user.userType === "ADMIN"){
            logWithTime(`🚫 Request Denied: Admin account with id: (${req.user.userID}) cannot be deactivated. Admin tried to do it from device ID: (${req.deviceID}).`);
            return res.status(403).json({
                success: false,
                message: "Admin account cannot be deactivated.",
                reason: "Admin is a system-level user and cannot be modified like a normal user."
            });
        }
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`Deactivate Account with id: (${req.user.userID}) Request Cancelled. Request is done from (${req.deviceID})`);
            return;
        }
        // Decativate account Require either Phone Number, Email ID or UserID for Verification along with Password
        if(user.userID !== req.foundUser.userID){ 
            logWithTime(`🚫 Deactivation Request Denied: Authenticated user (${user.userID}) tried to deactivate another account (${req.foundUser.userID})`);
            return res.status(403).json({
                success: false,
                message: "You are not authorized to deactivate this account.",
                reason: "Authenticated user and target user do not match."
            });
        }
        if(!req.body.password){
            return throwResourceNotFoundError(res,"Password");
        }
        if(user.isActive === false){
            logWithTime("🚫 User Account Deactivation Request Denied: User Account is already Inactive.");
            return res.status(400).json({
                success: false,
                message: "User Account is already Inactive.",
                suggestion: "Please activate your account first before trying to deactivate again."
            });
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while verifying the Deactivate Account Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyChangePasswordBody = async(req,res,next) => {
    try{
        if(req.user.userType === "ADMIN"){
            logWithTime(`🚫 Change Password Request Blocked: Admin (${req.user.userID}) attempted to change password from device (${req.deviceID})`);
            return res.status(403).json({
                success: false,
                message: "Admin password cannot be changed via this route.",
                reason: "Admin accounts are system-level and cannot be modified like regular users."
            });
        }
        if(!req.body){
            logWithTime(`User (${req.user.userID}) has provided an empty body to change password from device ID: (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Body");
        }
        const { oldPassword,newPassword } = req.body;
        if(!oldPassword){
            return throwResourceNotFoundError(res,"Old Password");
        }
        if(!newPassword){
            return throwResourceNotFoundError(res,"New Password");
        }
        if(oldPassword === newPassword){
            return res.status(400).json({
                success: false,
                message: "New password must be different from your current password."
            });
        }
        // Check for minimum length
        if (newPassword.length < 8) {
            return throwInvalidResourceError(res, "Password must be at least 8 characters long");
        }
        // Strong Password Format: At least one letter, one digit, and one special character
        const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return throwInvalidResourceError(
                res,
                "Password must contain at least one letter, one number, and one special character",
            );
        }
        if(!res.headersSent)return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error Occurred while verifying the Change Password Request with User ID: (${userID}) from device ID: (${req.deviceID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    verifySignUpBody: verifySignUpBody,
    verifySignInBody: verifySignInBody,
    verifySignOutBody: verifySignOutBody,
    verifyActivateUserAccountBody: verifyActivateUserAccountBody,
    verifyDeactivateUserAccountBody: verifyDeactivateUserAccountBody,
    verifyChangePasswordBody: verifyChangePasswordBody
}