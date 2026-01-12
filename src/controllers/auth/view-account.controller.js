const { errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { OK } = require("@configs/http-status.config");

const getMyAccount = async(req,res) => {
    try{
        const user = req.user; 
        if(!user){
            return throwResourceNotFoundError(res,"User");
        }
        const User_Account_Details = {
            "Customer ID": user.userID,
            "Phone Number": user.phoneNumber,
            "Email ID": user.emailID,
            "Verified": user.isVerified,
            "Last Login Time": user.lastLogin,
            "Account Status": user.isActive ? "Activated" : "Deactivated",
            "Blocked Account": user.isBlocked ? "Yes" : "No"
        }
        if(user.passwordChangedAt)User_Account_Details["Password Changed At"] = user.passwordChangedAt;
        if(user.activatedAt)User_Account_Details["Activated Account At"] = user.lastActivatedAt;
        if(user.deactivatedAt)User_Account_Details["Deactivated Account At"] = user.lastDeactivatedAt;
        if(user.lastLogout)User_Account_Details["Last Logout At"] = user.lastLogout;
        // Update data into auth.logs
        logAuthEvent(req, "PROVIDE_MY_ACCOUNT_DETAILS", null);
        logWithTime(`✅ User Account Details with User ID: (${user.userID}) is provided Successfully to User from device ID: (${req.deviceID})`);
        return res.status(OK).json({
            success: true,
            message: "Here is User Account Details",
            User_Account_Details
        });
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ An Internal Error Occurred while fetching the User Profile ${getIdentifiers}`);
        errorMessage(err);
        return throwInternalServerError(res);
    }
}

module.exports = { 
    getMyAccount 
};