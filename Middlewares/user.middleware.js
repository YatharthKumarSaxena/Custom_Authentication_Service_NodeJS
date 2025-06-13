const { errorMessage, throwInternalServerError } = require("../Configs/message.configs");
const { logWithTime,throwInternalServerError } = require("../Utils/timeStamps.utils")

const checkUpdateMyProfileRequest = (req,res,next) => {
    try{
        const immutableFields = ["userID", "userType", "isVerified", "isBlocked", "jwtTokenIssuedAt", "createdAt", "updatedAt", "isActive", "lastLogin"];
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
        return next();
    }catch(err){
        logWithTime("An Error occurred while validating the User Profile Updation Request");
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = {
    checkUpdateMyProfileRequest: checkUpdateMyProfileRequest
}