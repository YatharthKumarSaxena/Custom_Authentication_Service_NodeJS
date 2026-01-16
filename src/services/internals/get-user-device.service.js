const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");

/**
 * Service to fetch ALL sessions (Active + Expired) for Admin
 */
const getActiveSessionsService = async (targetUser) => {
    try {
        // 1. Fetch sessions
        const sessions = await UserDeviceModel.find({
            userId: targetUser._id,
            refreshToken: { $ne: null },
            jwtTokenIssuedAt: { $ne: null }
        })
        .populate("deviceId", "deviceUUID deviceName deviceType isBlocked")
        .lean();

        const currentTime = Date.now();
        const refreshExpiryMs = expiryTimeOfRefreshToken;

        // 2. Map detailed data (Filter hata diya, ab bas map karenge)
        const allDevices = sessions.reduce((acc, session) => {
            const issuedAt = new Date(session.jwtTokenIssuedAt).getTime();
            
            // Basic Validation: Agar issue date hi nahi hai toh skip karo
            if (!issuedAt) return acc;
            
            // Check Expiry
            const isExpired = (currentTime - issuedAt) > refreshExpiryMs;

            // Status Logic: Admin ko dikhane ke liye
            let sessionStatus = "Active";
            if (isExpired) sessionStatus = "Expired";
            if (session.deviceId?.isBlocked) sessionStatus = "Blocked"; // Bonus: Agar device blocked hai

            // 3. Push Complete Object
            acc.push({
                sessionReferenceId: session._id,
                
                deviceInfo: {
                    deviceName: session.deviceId?.deviceName || "Unknown Device",
                    deviceType: session.deviceId?.deviceType || "Unknown",
                    isBlocked: session.deviceId?.isBlocked || false,
                    uuid: session.deviceId?.deviceUUID
                },
                
                // Yahan hum status bhej rahe hain
                status: sessionStatus,
                isExpired: isExpired, // Frontend logic ke liye boolean bhi bhej do
                
                activity: {
                    firstSeenAt: session.firstSeenAt,
                    lastLoginAt: session.lastLoginAt,
                    lastLogoutAt: session.lastLogoutAt,
                    loginCount: session.loginCount,
                    tokenIssuedAt: session.jwtTokenIssuedAt
                },

                security: {
                    failed2FAAttempts: session.failed2FAAttempts,
                    twoFactorVerifiedAt: session.twoFactorVerifiedAt
                }
            });

            return acc;
        }, []);

        // 4. Sort: Pehle Active aaye, fir Expired (Recent login first)
        allDevices.sort((a, b) => {
            // Sort by status first (Active upar)
            if (a.isExpired === b.isExpired) {
                // Agar status same hai, toh time ke hisaab se sort karo
                return new Date(b.activity.lastLoginAt) - new Date(a.activity.lastLoginAt);
            }
            return a.isExpired ? 1 : -1; // Active pehle (-1), Expired baad mein (1)
        });

        return allDevices;

    } catch (err) {
        logWithTime(`❌ DB Error while fetching sessions for ${targetUser._id}`);
        console.error(err); 
        return null;
    }
};

module.exports = { getActiveSessionsService };