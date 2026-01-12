// Extracting the required modules
const { throwInvalidResourceError, errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { checkPasswordIsValid } = require("@utils/auth.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { OK } = require("@configs/http-status.config");

// Logic to activate user account
const activateMyAccount = async(req,res) => {
    try{
        const user = req.foundUser;
        let isPasswordValid = await checkPasswordIsValid(req,user);
        if(!isPasswordValid){
            return throwInvalidResourceError(res,"Password");
        }
        user.isActive = true;
        user.lastActivatedAt = Date.now();
        await user.save();
        // Activation success log
        logWithTime(`✅ Account activated for UserID: ${user.userID} from device ID: (${req.deviceID})`);
        // Update data into auth.logs
        logAuthEvent(req, "ACTIVATE", null);
        return res.status(OK).json({
            success: true,
            message: "Account activated successfully.",
            suggestion: "Please login to continue."
        });
    }catch(err){
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while activating the User Account ${getIdentifiers}`);
        errorMessage(err)
        return throwInternalServerError(res);
    }
}

module.exports = { activateMyAccount };
