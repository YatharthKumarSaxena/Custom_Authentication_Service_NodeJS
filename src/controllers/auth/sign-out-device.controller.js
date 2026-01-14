// Modules & Configs
const { OK, BAD_REQUEST } = require("@configs/http-status.config");
const { signOutService } = require("@services/auth/sign-out.service");
const { clearRefreshTokenCookie } = require("@services/auth/auth-cookie-service");

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
        
        // 1. Service Call
        const result = await signOutService(user, device);

        // Case: User pehle se logout tha
        if (result.alreadyLoggedOut) {
            // Cookie clear karna safe rehta hai even if DB says logged out
            clearRefreshTokenCookie(res); 
            
            logWithTime(`🚫 Logout Request Denied: User (${user.userId}) already logged out.`);
            return res.status(BAD_REQUEST).json({
                success: false,
                message: result.message,
                suggestion: "Please login first."
            });
        }

        // 2. Clear Cookie (Response Cleanup) - CRITICAL STEP
        // Service DB saaf karti hai, Controller Browser saaf karta hai
        clearRefreshTokenCookie(res);

        // 3. Success Response
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