const bcryptjs = require("bcryptjs");
const { SALT } = require("@configs/bcrypt.config");
const { OK } = require("@configs/http-status.config");
const { logoutUserCompletely } = require("@utils/authentication.utils");
const { checkPasswordIsValid } = require("@/utils/auth.util");
const { logAuthEvent } = require("@/utils/auth-log-util");
const { throwBadRequestError, throwInvalidResourceError, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const changePassword = async(req,res) => {
    try{
        const user = req.user;
        const { newPassword, confirmPassword, password } = req.body;
        let isPasswordValid = await checkPasswordIsValid(user.userId, password);
        if(!isPasswordValid){
            return throwInvalidResourceError(res,"Password");
        }
        if(newPassword !== confirmPassword){
            logWithTime(`❌ Confirm Password does not match with New Password for User ${getLogIdentifiers(req)}`);
            return throwBadRequestError(res,"Confirm Password does not match with New Password");
        }
        user.password = await bcryptjs.hash(newPassword, SALT);
        user.passwordChangedAt = Date.now();
        await user.save();
        const isUserLoggedOut = await logoutUserCompletely(user,res,req,"log out from all device request due to Password Change");
        if(!isUserLoggedOut)return;
        logWithTime(`✅ User Password with userId: (${user.userId}) is changed Succesfully from device id: (${req.deviceID})`);
        // Update data into auth.logs
        logAuthEvent(req, "CHANGE_PASSWORD", null);  
        return res.status(OK).json({
            success: true,
            message: "Your password has been changed successfully."
        });
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while changing the password of User ${getIdentifiers}`);
        return throwInternalServerError(res,err);
    }
}

module.exports = {
    changePassword
}