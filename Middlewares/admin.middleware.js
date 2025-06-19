// Middleware Code For Admin Controller

const { throwResourceNotFoundError, errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { AdminActionReasons } = require("../configs/user-id.config");
const { validateSingleIdentifier } = require("../utils/auth.utils");

// Verify Admin Body Request for Blocking / Unblocking a user
const verifyAdminBlockUnblockBody = async(req,res,next) => {
    try{
        if(!req.body.reason){
            return throwResourceNotFoundError(res,"AdminID");
        }
        if(!req.body.userID && !req.body.phoneNumber && !req.body.emailID){
            return throwResourceNotFoundError(res,"EmailID, UserID or Phone Number(Any one of these fields)");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.body?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while verifying the Admin Body Request with ID: (${req.user.userID}) on device having device ID: (${req.deviceID}) on user with userID: (${userID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}   

const verifyAdminUserViewRequest = async(req,res,next) => {
    try{
        // Means Admin has not provided userID for which he/she want to check User Account Details
        if(!req.query.userID){ 
            return throwResourceNotFoundError(res,"User ID in Query");
        }
        if(!req.query.reason){ // Checking that Reason is Provided by Admin or not
            return throwResourceNotFoundError(res,"Valid Reason to check User Account Details");
        }
        // Check that Provided Reason is Valid or not
        const reason = req.query.reason;
        // 🔒 Validate whether the reason is one of the valid enums
        if (!Object.values(AdminActionReasons).includes(reason)) {
            return res.status(400).json({
                success: false,
                message: "❌ Invalid reason provided. Allowed reasons are: " + Object.values(AdminActionReasons).join(", ")
            });
        }
        logWithTime(`🔍 Admin with id: (${req.user.userID})tried to check User Account Details of User having UserID: (${req.query.userID}) with reason: (${req.query.reason}) from device having device ID: (${req.deviceID})`);
        if(!res.headersSent)return next();
    }catch(err){
        const userID = req?.query?.userID || req?.foundUser?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while verifying the Admin Body Request with ID: (${userID}) on device having device ID: (${req.deviceID}) to check User with userID : (${req.query.userID}) Profile`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    verifyAdminBlockUnblockBody: verifyAdminBlockUnblockBody,
    verifyAdminUserViewRequest: verifyAdminUserViewRequest
}