/* This file is of MiddleWare that will handle request flow between Router and Controller*/ 
/* This file decides whether request from Router must be sent to Controller or not */

// Flow of Request :- 
/* App(Express Server)->Routers->Middlewares->Controllers->Models */
/* If an Error Occured in Middleware then Middleware will throw an Error , Request will not be forwarded to Controller */

// Extracting the Required Modules
const { throwResourceNotFoundError, throwInternalServerError, errorMessage, throwInvalidResourceError, throwAccessDeniedError, throwConflictError, getLogIdentifiers, logMiddlewareError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { fetchUser } = require("./helper.middleware");
const { validateSingleIdentifier } = require("../utils/auth.utils");
const { nameRegex, emailRegex, strongPasswordRegex, numberRegex, countryCodeRegex } = require("../configs/regex.config");
const { checkUserIsNotVerified } = require("../controllers/auth.controllers");
const { nameLength, passwordLength, countryCodeLength, emailLength, phoneNumberLength }  = require("../configs/fields-length.config");
const { isValidRegex, validateLength } = require("../utils/field-validators");
const { BAD_REQUEST, UNAUTHORIZED, FORBIDDEN } = require("../configs/http-status.config");
const verifySignUpBody = async (req,res,next) =>{
    // Validating the User Request
    try{
        if(!req.body || Object.keys(req.body).length === 0){
            logMiddlewareError("An Empty Sign Up Body", req);
            return throwResourceNotFoundError(res,"SignUp Body");
        }
        let {name,emailID,phoneNumber,password} = req.body;
        if(emailID)emailID = emailID.trim();
        if(password)password = password.trim();
        // Check name is present in Request Body or not
        if(name)name = name.trim();
        // Check if Name Field Provided Is It Valid Or Not
        if(typeof name === 'string' && name.length){
            if (!validateLength(name,nameLength.min,nameLength.max)){
                logMiddlewareError("Sign Up, Invalid Name Length",req);
                return throwInvalidResourceError(res,`Name , Name must be of minimum ${nameLength.min} letters and maximum ${nameLength.max} letters`);
            }
            if(!nameRegex.test(name)){
                logMiddlewareError("Sign Up, Invalid Name format",req);
                return throwInvalidResourceError(res,"Name can only include letters, spaces, apostrophes ('), periods (.), and hyphens (-).");
            }
            req.body.name = name;
        }
        let { countryCode,number } = phoneNumber || {};
        const missingFields = [];
        if (!emailID) missingFields.push("Email ID");
        if (!phoneNumber) missingFields.push("Phone Number");
        else {
            if (!countryCode) missingFields.push("Country Code field in Phone Number");
            if (!number) missingFields.push("Number field in Phone Number");
        }
        if (!password) missingFields.push("Password");
        else {
            // ✅ Move these two checks inside the "else" of password
            if (!validateLength(password,passwordLength.min,passwordLength.max)) {
                logMiddlewareError("Sign Up, Invalid Password Length",req);
                return throwInvalidResourceError(res, `Password, Password must be at least ${passwordLength.min} characters long and not more than ${passwordLength.max} characters`);
            }
            if (!isValidRegex(password,strongPasswordRegex)) {
                logMiddlewareError("Sign Up, Invalid Password Format",req);
                return throwInvalidResourceError(
                    res,
                    "Password Format, Password must contain at least one letter, one number, and one special character",
                );
            }
            req.body.password = password;
        }
        if(missingFields.length > 0){ // Throw Error as User Details are not properly given
            logMiddlewareError("Sign Up,Required Fields Missing",req);
            return throwResourceNotFoundError(res, missingFields.join(", "));
        }
        countryCode = countryCode.trim();
        number = number.trim();
        // 📧 Number Format Validation
        if (!validateLength(number,phoneNumberLength.min,phoneNumberLength.max)) {
            logMiddlewareError("Sign Up, Invalid Number length of Phone Number",req);
            return throwInvalidResourceError(res, `Number, Number must be at least ${phoneNumberLength.min} digits long and not more than ${phoneNumberLength.max} digits`);
        }
        if (!isValidRegex(number,numberRegex)){
            logMiddlewareError("Sign Up, Invalid Number format in Phone Number",req);
            return throwInvalidResourceError(
                res,
                "Phone Number Format, Please enter a valid phone number that consist of only numeric digits .",
            );
        }
        req.body.phoneNumber.number = number;
        // 📧 Country Code Format Validation
        if (!validateLength(countryCode,countryCodeLength.min,countryCodeLength.max)) {
            logMiddlewareError("Sign Up, Invalid Length of Country Code",req);
            return throwInvalidResourceError(res, `Country Code length, Country Code length must be at least ${countryCodeLength.min} digits long and not more than ${countryCodeLength.max} digits`);
        }
        if (!isValidRegex(countryCode,countryCodeRegex)){
            logMiddlewareError("Sign Up, Invalid Country Code format in Phone Number",req);
            return throwInvalidResourceError(
                res,
                `Country Code Format, Please enter a valid international country code number not starting from 0 and consist only numeric digits (e.g., 1 || 91 || 78)`,
            );
        }
        req.body.phoneNumber.countryCode = countryCode;
        // 📧 Email Format Validation
        // ✅ Move these two checks inside the "else" of password
        if (!validateLength(emailID,emailLength.min,emailLength.max)) {
            logMiddlewareError("Sign Up, Invalid Length of Email ID",req);
            return throwInvalidResourceError(res, `Email ID, Email ID must be at least ${emailLength.min} characters long and not more than ${emailLength.max} characters`);
        } 
        if (!isValidRegex(emailID,emailRegex)){
            logMiddlewareError("Sign Up, Invalid Email ID Format",req);
            return throwInvalidResourceError(res, "Email ID format. Email ID should have:- 🔹 Have no spaces,🔹 Contain exactly one @,🔹 Include a valid domain like .com, .in, etc.");
        }
        req.body.emailID = emailID;
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying the Sign up Request ${getIdentifiers}.`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifySignInBody = async (req,res,next) =>{
    // Validating the User SignIn Body
    try{
        if(!req.body || Object.keys(req.body).length === 0){
            logMiddlewareError("Empty Sign In Body",req);
            return throwResourceNotFoundError(res,"Body");
        }
        if(!req.body.password){
            logMiddlewareError("Sign In, Password Field Missing",req);
            return throwResourceNotFoundError(res,"Password");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logMiddlewareError("Sign In ,Provided User is unauthorized",req);
            return;
        }
        req.user = req.foundUser;
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying the Sign in Request ${getIdentifiers}.`);
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
            logWithTime(`🚫 Logout Request Denied: User ${req.user.userID} is already logged out from device ID: ${req.deviceID}`);
            return throwConflictError(res,"User is already logged out.","Please login first before trying to logout again.");
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying the Sign out Request ${getIdentifiers}.`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyActivateUserAccountBody = async(req,res,next) => {
    // Validating Request Body
    try{
        if(!req.body || Object.keys(req.body).length === 0){
            logMiddlewareError("Empty Activate Account Body", req);
            return throwResourceNotFoundError(res,"Body");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logMiddlewareError("Activate Account, Unauthorized User Provided",req);
            return;
        }
        if(req.foundUser.userType === "ADMIN"){
            logWithTime(`🚫 Request Denied: Admin account with id: ${req.foundUser.userID} cannot be activated. Admin tried to do it from device ID: ${req.deviceID}.`);
            return throwAccessDeniedError(res, "Admin account cannot be activated. Admin is a system-level user and cannot be modified like a normal user.")
        }
        if(!req.body.password){
            logMiddlewareError("Activate Account, Password Field Missing", req);
            return throwResourceNotFoundError(res,"Password");
        }
        const user = req.foundUser;
        if(user.isActive === true){
            logMiddlewareError("Active Account, Account already active",req);
            return throwConflictError(res,"User Account is already Active.", "Please deactivate your account first before trying to activate again.");
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying the Activate Account Request ${getIdentifiers}.`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyDeactivateUserAccountBody = async(req,res,next) => {
    // Validating Request Body
    try{
        if(!req.body || Object.keys(req.body).length === 0){
            logMiddlewareError("Empty Deactivate Account Body", req);
            return throwResourceNotFoundError(res,"Body");
        }
        const user = req.user;
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        if(user.userType === "ADMIN"){
            logWithTime(`🚫 Request Denied: Admin account with id: ${req.user.userID} cannot be deactivated. Admin tried to do it from device ID: ${req.deviceID}.`);
            return throwAccessDeniedError(res, "Admin account cannot be deactivated. Admin is a system-level user and cannot be modified like a normal user.")
        }
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logMiddlewareError("Deactivate Account, Unauthorized User Provided",req);
            return;
        }
        // Decativate account Require either Phone Number, Email ID or UserID for Verification along with Password
        if(user.userID !== req.foundUser.userID){ 
            logWithTime(`🚫 Deactivation Request Denied: Authenticated user ${user.userID} tried to deactivate another account ${req.foundUser.userID}`);
            return res.status(UNAUTHORIZED).json({
                success: false,
                message: "You are not authorized to deactivate this account.",
                reason: "Authenticated user and target user do not match."
            });
        }
        if(!req.body.password){
            logMiddlewareError("Deactivate Account, Password Field Missing",req);
            return throwResourceNotFoundError(res,"Password");
        }
        if(user.isActive === false){
            logMiddlewareError("Decativate Account, Account already deactive",req);
            return throwConflictError(res,"User Account is already Inactive.","Please activate your account first before trying to deactivate again.")
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying the Deactivate Account Request ${getIdentifiers}.`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyChangePasswordBody = async(req,res,next) => {
    try{
        if(req.user.userType === "ADMIN"){
            logWithTime(`🚫 Change Password Request Blocked: Admin ${req.user.userID} attempted to change password from device ${req.deviceID}`);
            return res.status(FORBIDDEN).json({
                success: false,
                message: "Admin password cannot be changed via this route.",
                reason: "Admin accounts are system-level and cannot be modified like regular users."
            });
        }
        if(!req.body || Object.keys(req.body).length === 0){
            logMiddlewareError("Empty Change Password Body",req);
            return throwResourceNotFoundError(res,"Body");
        }
        const { oldPassword,newPassword } = req.body;
        if(!oldPassword){
            logMiddlewareError("Change Password, Old Password Field Missing",req);
            return throwResourceNotFoundError(res,"Old Password");
        }
        if(!newPassword){
            logMiddlewareError("Change Password, New Password Field Missing",req);
            return throwResourceNotFoundError(res,"New Password");
        }
        if(oldPassword === newPassword){
            logMiddlewareError("Change Password, Old and New Password are same",req);
            return res.status(BAD_REQUEST).json({
                success: false,
                message: "New password must be different from your current password."
            });
        }
        // Check for minimum length
        if (!validateLength(newPassword,passwordLength.min,passwordLength.max)) {
            logMiddlewareError("Sign Up, Invalid Password Length",req);
            return throwInvalidResourceError(res, `Password, Password must be at least ${passwordLength.min} characters long and not more than ${passwordLength.max} characters`);
        }
        // Strong Password Format: At least one letter, one digit, and one special character
        if (!isValidRegex(newPassword,strongPasswordRegex)) {
            logMiddlewareError("Sign Up, Invalid Password format",req);
            return throwInvalidResourceError(
                res,
                "Password, Password must contain at least one letter, one number, and one special character",
            );
        }
        if(!res.headersSent)return next();
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while verifying the Change Password Request ${getIdentifiers}.`);
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