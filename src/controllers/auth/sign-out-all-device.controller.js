// Extracting the required modules
const { throwSpecificInternalServerError, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { OK } = require("@configs/http-status.config");
const { logoutUserCompletely } = require("@services/auth/auth-session.service");

const signOutAllDevices = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;

        // 1. Service Call
        const isUserLoggedOut = await logoutUserCompletely(user, device);

        // 2. Handle Failure 
        if (!isUserLoggedOut) {
            return throwSpecificInternalServerError(res, "Failed to process logout request, please try again later.");
        }

        // 3. Extract correct identifiers 
        res.set('x-access-token', '');
        const deviceUUID = req.device.deviceUUID;
        const userId = user.userId; 

        logWithTime(`🔓 User (${userId}) successfully logged out from all devices via request from (${deviceUUID})`);
        
        const praiseBy = user.firstName || "User";
        
        return res.status(OK).json({
            success: true,
            message: `${praiseBy}, you are successfully logged out from all devices.`
        });

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error occurred while logging out the User ${getIdentifiers}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { 
    signOutAllDevices
};