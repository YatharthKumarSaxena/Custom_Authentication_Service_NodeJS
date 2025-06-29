// Middleware Code For Admin Controller

const { throwResourceNotFoundError, errorMessage, throwInternalServerError, logMiddlewareError, getLogIdentifiers } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { validateSingleIdentifier } = require("../utils/auth.utils");
const { AdminActionReasons } = require("../configs/user-id.config");

// Verify Admin Body Request for Blocking / Unblocking a user
const verifyAdminBlockUnblockBody = async(req,res,next) => {
    try{
        if(!req.body || Object.keys(req.body).length === 0){
            logMiddlewareError("Empty Block/Unblock Body",req);
            return throwResourceNotFoundError(res,"Body");
        }
        if(!req.body.reason){
            logMiddlewareError("Block/Unblock Account, Missing Reason Field",req);
            return throwResourceNotFoundError(res,"Reason");
        }
        if(!req.body.userID && !req.body.phoneNumber && !req.body.emailID){
            logMiddlewareError("Block/Unblock Account, Missing User Details to be blocked/unblocked",req);
            return throwResourceNotFoundError(res,"EmailID, UserID or Phone Number(Any one of these fields)");
        }
        const validateRequestBody = validateSingleIdentifier(req,res);
        if(!validateRequestBody)return;
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req.foundUser.userID || "Unauthorized User";
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while verifying the Admin Body Request (${getIdentifiers}) on user with userID: (${userID})`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}   

const verifyAdminCheckUserSessionsBody = async(req,res,next) => {
    try{
        const validateRequestBody = validateSingleIdentifier(req,res,"query");
        if(!validateRequestBody)return;
        if (!(req.query.userID || req.query.emailID || req.query.phoneNumber)) {
            logMiddlewareError("Admin Check User Sessions Body, Missing User Details whose session details need to be checked",req);
            return throwResourceNotFoundError(res, "User Identifier (userID/emailID/phoneNumber)");
        }
        if(!req.query.reason){
            logMiddlewareError("Admin Check User Sessions Body, Missing Reason Field",req);
            return throwResourceNotFoundError(res,"Reason");
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req.foundUser.userID || "Unauthorized User";
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while verifying the Admin Body Request (${getIdentifiers}) on user with userID: (${userID})`);
        errorMessage(err);
        return throwInternalServerError(res); 
    }
}

module.exports = {
    verifyAdminBlockUnblockBody: verifyAdminBlockUnblockBody,
    verifyAdminCheckUserSessionsBody: verifyAdminCheckUserSessionsBody
}