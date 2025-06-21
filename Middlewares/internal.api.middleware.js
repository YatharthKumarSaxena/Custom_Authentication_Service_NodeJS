const { errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const { AdminActionReasons } = require("../configs/user-id.config");

const checkUpdateMyProfileRequest = (req,res,next) => {
    try{
        const user = req.user;
        if(user.userType === "ADMIN"){
            logWithTime(`⚠️ Access Denied: Admin (${user.userID}) cannot update their profile details via API Request. Request made from device id: (${req.deviceID})`);
            return res.status(403).json({
                message: "Access Denied: Admin cannot update their profile details via API Request"
            })
        }
        if(!req.body){
            logWithTime(` No Changes by (${user.userID}) is requested to update their profile from device id: (${req.deviceID})`);
            return res.status(200).json({
                message: "No changes detected. Your profile remains the same."
            })
        }
        // 🚫 Fields Not Allowed to Be Modified
        const immutableFields = [
            "_id", "__v",                     // Mongo internal
            "userID", "userType",             // Identity + Role
            "isVerified", "isBlocked",        // Security status
            "jwtTokenIssuedAt",               // Token control
            "createdAt", "updatedAt",         // System timestamps
            "isActive", "lastLogin",          // Lifecycle flags
            "verificationToken",              // Token used for verifying email/phone
            "blockReason","unblockReason",
            "blockedAt","unblockedAt",
            "lastActivatedAt","lastDeactivatedAt",
            "blockedBy","unblockedBy",
            "lastLogout","loginCount",
            "blockVia","unblockVia",
            "blockCount","devices","unblockCount",
            "passwordChangedAt","otp",
            "refreshToken","password",
            "timestamps","versionKey"
        ];
        let attemptedFields = [];
        for (let field of immutableFields) {
            if (field in req.body) {
                attemptedFields.push(field);
            }
        }
        if (attemptedFields.length > 0) {
            const userID = req.user?.userID || "UNKNOWN_USER";
            logWithTime(`🚨 SECURITY ALERT: User [${userID}] attempted to modify restricted fields: ${attemptedFields.join(", ")} from device id: (${req.deviceID})`);
            return res.status(403).json({
                message: `⚠️ You are not allowed to update some profile fields.`,
                restrictedFields: attemptedFields,
                warning: "This attempt has been logged. Please contact support if you believe this is a mistake."
            });
        }
        if (!res.headersSent) return next();
    }catch(err){
        const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
        logWithTime(`❌ An Internal Error occurred while validating the User Profile Updation Request made from device id: (${req.deviceID}) for User (${userID}) `);
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
            return throwResourceNotFoundError(res,"Reason to fetch user account details");
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
    checkUpdateMyProfileRequest: checkUpdateMyProfileRequest,
    verifyAdminUserViewRequest: verifyAdminUserViewRequest
}