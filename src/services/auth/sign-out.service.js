const { UserDeviceModel } = require("@models/user-device.model"); // Naya Model Import
const { logAuthEvent } = require("@utils/auth-log-util");
const { logWithTime } = require("@utils/time-stamps.util");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");

/**
 * Service to sign out from a specific device
 * Logic: Refresh Token ko null kar do, taaki session invalid ho jaye.
 */
const signOutService = async (user, device) => {
    
    // 1. Find the Session
    const userDeviceSession = await UserDeviceModel.findOne({
        userId: user._id,
        deviceId: device._id
    });

    // Case: Session hi nahi mila (Rare edge case)
    if (!userDeviceSession) {
        return { 
            alreadyLoggedOut: true,
            message: "Session not found." 
        };
    }

    // Case: Pehle se Logged Out hai (Token null hai)
    if (!userDeviceSession.refreshToken) {
        return { 
            alreadyLoggedOut: true, 
            message: "User is already logged out from this device." 
        };
    }

    // 2. Invalidate Session (DB Update)
    userDeviceSession.refreshToken = null; // Token uda do
    userDeviceSession.lastLogoutAt = new Date(); // Time note kar lo
    
    await userDeviceSession.save();

    // 3. Log Event
    logWithTime(`📤 User (${user.userId}) signed out from device: ${device.deviceUUID}`);
    
    logAuthEvent(
        user, 
        device, 
        AUTH_LOG_EVENTS.LOGOUT, // Ensure LOGOUT enum exists
        `User signed out from specific device.`,
        null
    );

    return {
        success: true,
        message: "Signed out successfully."
    };
};

module.exports = { signOutService };