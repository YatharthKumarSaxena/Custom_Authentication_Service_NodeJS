// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { signOutService } = require("@services/auth/sign-out.service");

// Error Handlers
const { 
    throwInternalServerError, 
    getLogIdentifiers 
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

const signOut = async (req, res) => {
    try {
        const user = req.user;
        const device = req.device;
        const userDevice = req.userDevice; 
        
        // 1. Service Call
        const result = await signOutService(user, device, userDevice);

        // Case: User pehle se logout tha
        if (result.alreadyLoggedOut) {  
            res.set('x-access-token', '');
            logWithTime(`🚫 Logout Request Denied: User (${user.userId}) already logged out.`);
            return res.status(OK).json({
                success: true,
                message: result.message
            });
        }

        
        // 3. Success Response
        res.set('x-access-token', '');
        const praiseBy = user.firstName || "User";
        
        logWithTime(`✅ Sign-out successful for User ID: ${user.userId} on Device ID: ${device.deviceUUID}`);
        return res.status(OK).json({
            success: true,
            message: `${praiseBy}, you have successfully signed out from this device.`
        });

    } catch (err) {
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Internal Error while logging out ${getIdentifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
}

module.exports = { signOut };