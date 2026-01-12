// Extracting the required modules
const { throwInvalidResourceError, errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { OK } = require("@configs/http-status.config");

const signOutAllDevices = async (req,res) => {
    try{
        let user = req.user;
        if(!user){
            return throwInvalidResourceError(res,"UserID");
        }
        const isUserLoggedOut = await logoutUserCompletely(user,res,req,"log out from all device request")
        if(!isUserLoggedOut)return;
        // Update data into auth.logs
        logAuthEvent(req, "LOGOUT_ALL_DEVICE", null);    
        if (user.isBlocked) {
            logWithTime(`⚠️ Blocked user ${user.userID} attempted to logout from all devices from (${req.deviceID}).`);
            return throwBlockedAccountError(res); // ✅ Don't proceed if blocked
        }
        else logWithTime(`🔓 User with (${user.userID}) is Successfully logged out from all devices. User used device having device ID: (${req.deviceID})`);
        const praiseBy = user.name || user.userID;
        return res.status(OK).json({
            success: true,
            message: praiseBy+", You are successfully logged out from all devices",
            userID: user.userID,
        })
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while logging out the User ${getIdentifiers}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = { 
    signOutAllDevices
};