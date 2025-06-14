/* This file is of MiddleWare that will handle request flow between Router and Controller*/ 
/* This file decides whether request from Router must be sent to Controller or not */

// Flow of Request :- 
/* App(Express Server)->Routers->Middlewares->Controllers->Models */
/* If an Error Occured in Middleware then Middleware will throw an Error , Request will not be forwarded to Controller */

// Extracting the Required Modules
const UserModel = require("../Models/User.model");
const {throwResourceNotFoundError,throwInternalServerError,errorMessage} = require("../Configs/errorHandler.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");
const { checkUserIsNotVerified,fetchUser} = require("./helperMiddlewares");
const { adminID } = require("../Configs/userID.config");

// ✅ SRP: This function only checks for existing users via phoneNumber or emailID
async function checkUserExists(emailID,phoneNumber){
    try{
        let count = 0;
        let user1 = await UserModel.findOne({phoneNumber: phoneNumber})
        let reason = "";
        if(user1){
            logWithTime("⚠️ User Already Exists with Phone Number: "+phoneNumber);
            reason = "Phone Number: "+phoneNumber;
            count++;
        }
        user1 = await UserModel.findOne({emailID: emailID});
        if(user1){
            logWithTime("⚠️ User Already Exists with Email ID: "+emailID);
            if(count)reason= "Phone Number: "+phoneNumber+" and Email ID: "+emailID;
            else reason = "Email ID: "+emailID;
            count++;
        }
        if(count!==0)logWithTime("⚠️ Invalid Registration");
        return reason;
    }catch(err){
        logWithTime("⚠️ An Error occured while Checking whether User Exists or not");
        errorMessage(err);
        return;
    }
}

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
        // Check Password is present in Request Body or not
        if(!req.body.password){
            if(userIsValid)reason = reason+"Password";
            else reason = reason+" ,Password";
            userIsValid = false;
        }
        // Check Address is present in Request Body or not
        if (
        !Array.isArray(req.body.address) || 
        req.body.address.length === 0 || 
        Object.keys(req.body.address[0]).length === 0  // <-- Empty object check
        ) {
            if(userIsValid)reason = reason+"Address";
            else reason = reason+" and Address";
            userIsValid = false;
        }
        else{ // Check inner Address details are present or not
            const address = req.body.address[0];
            if(!address.localAddress){
                if(userIsValid)reason = reason+"Local Address field in Address field";
                else reason = reason+", Local Address field in Address field";
                userIsValid = false;
            }
            if(!address.city){
                if(userIsValid)reason = reason+"City field in Address field";
                else reason = reason+", City field in Address field";
                userIsValid = false;
            }
            if(!address.pincode){
                if(userIsValid)reason = reason+"Pincode field in Address field";
                else reason = reason+", Pincode field in Address field";
                userIsValid = false;
            }
            if(!address.state){
                if(userIsValid)reason = reason+"State field in Address field";
                else reason = reason+", State field in Address field";
                userIsValid = false;
            }
            if(!address.country){
                if(userIsValid)reason = reason+"and Country field in Address field";
                else reason = reason+" and Country field in Address field";
                userIsValid = false;
            }
        }
        if(userIsValid){ // Check that User Exists with Phone Number or Email ID
            let emailID = req.body.emailID;
            let phoneNumber = req.body.phoneNumber;
            // Checking User already exists or not 
            const userExistReason = await checkUserExists(emailID,phoneNumber);
            if(userExistReason !== ""){
                return res.status(400).json({
                    message: "User Already Exists with "+userExistReason,
                    warning: "Use different Email ID or Phone Number or both based on Message"
                })
            }
        }
        else{ // Throw Error as User Details are not properly given
            return throwResourceNotFoundError(res,reason);
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("⚠️ Error happened while validating the User Request");
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
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime("Login Request Cancelled")
            return;
        }
        const user = req.foundUser;
        // ✅ Now Check if User is Already Logged In
        const result = await checkUserIsNotVerified(user,res);
        if (!result) {
            logWithTime("🚫 Request Denied: User is already logged in.");
            return res.status(400).json({
            success: false,
            message: "User is already logged in.",
            suggestion: "Please logout first before trying to login again."
            });
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("⚠️ Error happened while validating the User SignIn Request");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifySignOutBody = async (req,res,next) => {
    // Validating the User SignIn Body
    try{
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime("Logout Request Cancelled")
            return;
        }
        const user = req.foundUser;
        // ✅ Now Check if User is Already Logged Out 
        const result = await checkUserIsNotVerified(user,res);
        if (result) {
            logWithTime("🚫 Logout Request Denied: User is already logged out.");
            return res.status(400).json({
            success: false,
            message: "User is already logged out.",
            suggestion: "Please login first before trying to logout again."
            });
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("⚠️ Error happened while validating the User Sign Out Request");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

const verifyActivateUserAccountBody = async(req,res,next) => {
    // Validating Request Body
    try{
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime("Activate Account Request Cancelled")
            return;
        }
        if(req.foundUser.userID === adminID){
            logWithTime("🚫 Request Denied: Admin account cannot be activated.");
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
            logWithTime("🚫 User Account Activation Request Denied: User Account is already Active.");
            return res.status(400).json({
            success: false,
            message: "User Account is already Active.",
            suggestion: "Please deactivate your account first before trying to activate again."
            });
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("⚠️ Error happened while validating the User Account Activation Request")
        return throwInternalServerError(res);
    }
}

const verifyDeactivateUserAccountBody = async(req,res,next) => {
    // Validating Request Body
    try{
        if(req.body.userID === adminID){
            logWithTime("🚫 Request Denied: Admin account cannot be deactivated.");
            return res.status(403).json({
            success: false,
            message: "Admin account cannot be deactivated.",
            reason: "Admin is a system-level user and cannot be modified like a normal user."
            });
        }
        let verifyWith = await fetchUser(req,res);
        if(verifyWith === ""){
            logWithTime("Deactivate Account Request Cancelled")
            return;
        }
        if(!req.body.password){
            return throwResourceNotFoundError(res,"Password");
        }
        const user = req.foundUser;
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
        logWithTime("⚠️ Error happened while validating the User Account Deactivation Request")
        return throwInternalServerError(res);
    }
}

module.exports = {
    verifySignUpBody: verifySignUpBody,
    verifySignInBody: verifySignInBody,
    verifySignOutBody: verifySignOutBody,
    verifyActivateUserAccountBody: verifyActivateUserAccountBody,
    verifyDeactivateUserAccountBody: verifyDeactivateUserAccountBody
}