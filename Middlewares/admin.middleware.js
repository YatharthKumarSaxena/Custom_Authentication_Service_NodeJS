// Middleware Code For Admin Controller

const { throwResourceNotFoundError, errorMessage, throwInternalServerError } = require("../Configs/message.configs");
const { logWithTime } = require("../Utils/timeStamps.utils");

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

module.exports = {
    verifyAdminBody:verifyAdminBody
}