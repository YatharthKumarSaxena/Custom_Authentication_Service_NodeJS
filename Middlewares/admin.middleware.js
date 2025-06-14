// Middleware Code For Admin Controller

const { throwResourceNotFoundError, errorMessage, throwInternalServerError } = require("../Configs/errorHandler.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");
const { AdminActionReasons } = require("../Configs/userID.config");

// Verify Admin Body Request for Blocking / Unblocking a user
const verifyAdminBody = async(req,res,next) => {
    try{
        if(!req.body.userID){
            return throwResourceNotFoundError(res,"AdminID");
        }
        if(!req.body.requestedUserID && !req.body.phoneNumber && !req.body.emailID){
            return throwResourceNotFoundError(res,"EmailID,Requested UserID or Phone Number(At least one of these fields)");
        }
        // Very next line should be:
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("⚠️ An Error occurred while validating the Admin Body Request for blocking/unblocking users")
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
        logWithTime(`🔍 Admin tried to check User Account Details of User having UserID: (${req.query.userID}) with reason: (${req.query.reason})`);
        return next();
    }catch(err){
        logWithTime("⚠️ An Error occurred while validating the Admin Request while checking a User Account Details")
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    verifyAdminBody:verifyAdminBody,
    verifyAdminUserViewRequest: verifyAdminUserViewRequest
}