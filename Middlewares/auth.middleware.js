/* This file is of MiddleWare that will handle request flow between Router and Controller*/ 
/* This file decides whether request from Router must be sent to Controller or not */

// Flow of Request :- 
/* App(Express Server)->Routers->Middlewares->Controllers->Models */
/* If an Error Occured in Middleware then Middleware will throw an Error , Request will not be forwarded to Controller */

// Extracting the Required Modules
const {throwResourceNotFoundError,throwInternalServerError,errorMessage} = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { checkUserIsNotVerified,fetchUser} = require("./helper.middleware");
const { adminID } = require("../configs/user-id.config");
const { validateSingleIdentifier } = require("../utils/auth.utils");

// For Delivery Services this field checking become Mandatory
const verifyAddressField = async (req, res, next) => {
    try{
        const address = req?.user?.address || req?.body?.address;
        if(!Array.isArray(address) || address.length === 0 || Object.keys(address[0]).length === 0){
            return throwResourceNotFoundError(res, "Address");
        }
        const addr = address[0];
        let missingFields = [];
        if (!addr.localAddress) missingFields.push("Local Address");
        if (!addr.city) missingFields.push("City");
        if (!addr.pincode) missingFields.push("Pincode");
        if (!addr.state) missingFields.push("State");
        if (!addr.country) missingFields.push("Country");
        if (missingFields.length > 0) {
            return throwResourceNotFoundError(res, missingFields.join(", "));
        }
        if (!res.headersSent) return next();
    }catch (err){
        logWithTime("⚠️ Error occurred while validating the Address field ");
        errorMessage(err);
        return throwInternalServerError(res);
    }
};

const verifySignUpBody = async (req,res,next) =>{
    // Validating the User Request
    try{
        // Check name is present in Request Body or not
        let userIsValid = true; // Assuming that Request Provided is correct
        let reason = ""; // Stores Reason for Invalid Request
        if(!req.body.name){
            userIsValid = false;
            reason = reason+"Name";
        }
        // Check Email ID is present in Request Body or not
        if(!req.body.emailID){
            if(userIsValid)reason = reason+"Email ID";
            else reason = reason+" ,Email ID";
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
            else reason = reason+" ,Device Information";
            userIsValid = false;           
        }
         // Check Password is present in Request Body or not
        if(!req.body.password){
            if(userIsValid)reason = reason+"Password";
            else reason = reason+" ,Password";
            userIsValid = false;
        } else {
            // ✅ Move these two checks inside the "else" of password
            if (req.body.password.length < 8) {
                return throwInvalidResourceError(res, "Password must be at least 8 characters long");
            }
            const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,}$/;
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
        if(!req.body.password){
            return throwResourceNotFoundError(res,"Password");
        }
        if(!req.body.device){
            return throwResourceNotFoundError(res,"Device Information");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`Login Request Cancelled for User (${req.user.userID}) from device ID: (${req.deviceID})`)
            return;
        }
        const user = req.foundUser;
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
    // Validating the User SignIn Body
    try{
        const user = req.user;
        // ✅ Now Check if User is Already Logged Out 
        const isNotVerified = await checkUserIsNotVerified(user,res);
        if (isNotVerified) {
            logWithTime(`🚫 Logout Request Denied: User (${req.user.userID}) is already logged out from device ID: (${req.deviceID})`);
            return res.status(400).json({
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
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime(`Activate Account with id: (${req.user.userID}) Request Cancelled. Request is done from (${req.deviceID})`);
            return;
        }
        if(req.foundUser.userID === adminID){
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
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        if(req.body.userID === adminID){
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
        if(!req.body.password){
            return throwResourceNotFoundError(res,"Password");
        }
        const user = req.user;
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
    verifyAddressField: verifyAddressField,
    verifyChangePasswordBody: verifyChangePasswordBody
}