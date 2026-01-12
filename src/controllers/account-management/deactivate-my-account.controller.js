// Extracting the required modules
const { throwInvalidResourceError, errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { checkPasswordIsValid } = require("@utils/auth.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { OK } = require("@configs/http-status.config");

// Logic to deactivate user account
const deactivateMyAccount = async(req,res) => {
    try{
        const user = req.user;
        let isPasswordValid = await checkPasswordIsValid(req,user);
        if(!isPasswordValid){
            return throwInvalidResourceError(res,"Password");
        }
        user.isActive = false;
        user.lastDeactivatedAt = Date.now();
        // Forcibly Log Out User when its Account is Deactivated
        const isUserLoggedOut = await logoutUserCompletely(user,res,req,"decativate account request")
        if(!isUserLoggedOut)return;
        // Deactivation success log
        logWithTime(`🚫 Account deactivated for UserID: ${user.userID} from device id: (${req.deviceID})`);
        // Update data into auth.logs
        logAuthEvent(req, "DEACTIVATE", null);
        return res.status(OK).json({
            success: true,
            message: "Account deactivated successfully.",
            notice: "You are logged out"
        });
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while deactivating the User Account ${getIdentifiers}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = { deactivateMyAccount };