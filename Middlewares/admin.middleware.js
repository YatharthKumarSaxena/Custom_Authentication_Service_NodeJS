// Middleware Code For Admin Controller

const { throwResourceNotFoundError, errorMessage, throwInternalServerError } = require("../Configs/message.configs");
const { logWithTime } = require("../Configs/timeStampsFunctions.config");

// Verify Admin Body Request for Blocking / Unblocking a user
const verifyAdminBody = async(req,res,next) => {
    try{
        if(!req.body.adminID){
            return throwResourceNotFoundError("AdminID");
        }
        if(!req.body.requestedUserID && !req.body.phoneNumber && !req.body.emailID){
            return throwResourceNotFoundError("EmailID,Requested UserID or Phone Number(At least one of these fields)");
        }
        return next();
    }catch(err){
        logWithTime("⚠️ An Error occurred while validating the Admin Body Request for blocking/unblocking users")
        errorMessage(err);
        return throwInternalServerError(res);
    }
}   