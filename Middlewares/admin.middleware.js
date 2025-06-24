// Middleware Code For Admin Controller

const { throwResourceNotFoundError, errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { validateSingleIdentifier } = require("../utils/auth.utils");

// Verify Admin Body Request for Blocking / Unblocking a user
const verifyAdminBlockUnblockBody = async(req,res,next) => {
    try{
        if(!req.body){
            logWithTime(`An Unknown User has provided an empty body to block/unblock account from device ID: (${req.deviceID})`);
            return throwResourceNotFoundError(res,"Body");
        }
        if(!req.body.reason){
            return throwResourceNotFoundError(res,"Reason");
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

const verifyAdminCheckUserSessionsBody = async(req,res,next) => {
    try{
        if (!(req.query.userID || req.query.emailID || req.query.phoneNumber)) {
            return throwResourceNotFoundError(res, "User Identifier (userID/emailID/phoneNumber)");
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.query?.userID || "UNKNOWN_USER";
        logWithTime(`❌ Internal Error occurred while verifying the Admin Body Request with ID: (${req.user.userID}) on device having device ID: (${req.deviceID}) on user with userID: (${userID})`);
        errorMessage(err);
        return throwInternalServerError(res); 
    }
}

module.exports = {
    verifyAdminBlockUnblockBody: verifyAdminBlockUnblockBody,
    verifyAdminCheckUserSessionsBody: verifyAdminCheckUserSessionsBody
}