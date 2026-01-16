const { logAuthEvent } = require("@utils/auth-log-util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { expiryTimeOfRefreshToken } = require("@/configs/token.config");

const signOutService = async (user, device, userDevice) => {

    const time = new Date();
    // Safety check: agar jwtIssuedAt undefined hua toh crash nahi hoga
    const jwtIssuedAt = userDevice.jwtTokenIssuedAt ? new Date(userDevice.jwtTokenIssuedAt).getTime() : time.getTime();

    // 1. Pehle se Logged Out check
    if (!userDevice.refreshToken) {
        return { 
            alreadyLoggedOut: true, 
            message: "User is already logged out from this device." 
        };
    }

    // 2. Invalidate Session (DB Update) - CRITICAL STEP
    userDevice.refreshToken = null; 
    userDevice.lastLogoutAt = time; 
    
    // ✅ Save First (Clean the DB)
    await userDevice.save();
    
    // 3. Log Event (Hamesha Log karo, chahe expired ho ya nahi - Audit ke liye acha hai)
    logAuthEvent(
        user, 
        device, 
        AUTH_LOG_EVENTS.LOGOUT_SPECIFIC_DEVICE, 
        `User signed out manually.`,
        null
    );

    // 4. Check Expiry (Optional: Sirf Frontend message ke liye)
    if ((time.getTime() - jwtIssuedAt) > expiryTimeOfRefreshToken) {
        return {
            alreadyLoggedOut: true, // Frontend shayad is flag pe redirect kare
            message: "Session expired, but logged out successfully." 
        }
    }

    return {
        success: true,
        message: "Signed out successfully."
    };
};

module.exports = { signOutService };