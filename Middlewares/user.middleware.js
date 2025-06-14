const { errorMessage, throwInternalServerError } = require("../Configs/errorHandler.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");
const { adminID } = require("../Configs/userID.config");

const checkUpdateMyProfileRequest = (req,res,next) => {
    try{
        const user = req.user;
        if(user.userID === adminID){
            logWithTime("⚠️ Access Denied: Admin cannot update their profile details via API Request")
            return res.status(403).json({
                message: "Access Denied: Admin cannot update their profile details via API Request"
            })
        }
        if(!req.body){
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
            "verificationToken"               // Token used for verifying email/phone
        ];
        let attemptedFields = [];
        for (let field of immutableFields) {
            if (field in req.body) {
                attemptedFields.push(field);
            }
        }
        if (attemptedFields.length > 0) {
            const userID = req.user?.userID || "UNKNOWN_USER";
            logWithTime(`🚨 SECURITY ALERT: User [${userID}] attempted to modify restricted fields: ${attemptedFields.join(", ")}`);
            return res.status(403).json({
                message: `⚠️ You are not allowed to update some profile fields.`,
                restrictedFields: attemptedFields,
                warning: "This attempt has been logged. Please contact support if you believe this is a mistake."
            });
        }
        if (!res.headersSent) return next();
    }catch(err){
        logWithTime("An Error occurred while validating the User Profile Updation Request");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    checkUpdateMyProfileRequest: checkUpdateMyProfileRequest
}