// Extracting the required modules
const { throwInvalidResourceError, errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { getDeviceByID } = require("@utils/device.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { BAD_REQUEST, OK } = require("@configs/http-status.config");

const signOut = async(req,res) => {
    try{
        const user = req.user;
        if(!user){
            return throwInvalidResourceError(res,"UserID");
        }
        let device = await getDeviceByID(user,req.deviceID)
        if(!device){
            return throwInvalidResourceError(res,"Device ID");
        }
        // ✅ Now Check if User is Already Logged In
        const result = await checkUserIsNotVerified(req,res);
        if(result){
            logWithTime(`🚫 Request Denied: User (${user.userID}) is already logged out from device ID: (${req.deviceID}). User tried this using device ID: (${req.deviceID})`);
            return res.status(BAD_REQUEST).json({
                success: false,
                message: "User is already logged out from all devices.",
                suggestion: "Please login first before trying to logout again."
            });
        }
        const praiseBy = user.name || user.userID;
        // Check if User is Logged in on this Single Device  
        if(user.devices.info.length === 1){ 
            // If yes then isVerified is changed to False
            const isUserLoggedOut = await logoutUserCompletely(user,res,req,"log out from current device request")
            if(!isUserLoggedOut)return;
            logWithTime(`User (${user.userID}) has log out from last active device successfully from device id: (${req.deviceID})`);
            // Update data into auth.logs
            logAuthEvent(req, "LOGOUT_SPECIFIC_DEVICE", null);  
            return res.status(OK).json({
                success: true,
                message: praiseBy+", successfully signed out from the specified device. Now, You are not signed from any of the device"
            });
        }
        user.devices.info = user.devices.info.filter(item => item.deviceID !== req.deviceID);

        await user.save();
        if (user.isBlocked) {
            logWithTime(`⚠️ Blocked user ${user.userID} attempted to logout from device id: ${req.deviceID}.`);
            return throwBlockedAccountError(res); // ✅ Don't proceed if blocked
        }
        else logWithTime(`📤 User (${user.userID}) signed out from device: ${req.deviceID}`);
        // Update data into auth.logs
        logAuthEvent(req, "LOGOUT_SPECIFIC_DEVICE");  
        return res.status(OK).json({
            success: true,
            message: praiseBy+", successfully signed out from this device."
        });

    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while logging in the User ${getIdentifiers}`);
        errorMessage(err)
        return throwInternalServerError(res);        
    }
}

module.exports = { 
    signOut
};