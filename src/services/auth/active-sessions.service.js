const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");

/**
 * Service to fetch VALID active sessions
 */
const getActiveSessionsService = async (user, currentDeviceId) => {
    try {
        const sessions = await UserDeviceModel.find({
            userId: user._id,
            refreshToken: { $ne: null },
            jwtTokenIssuedAt: { $ne: null }
        })
        .populate("deviceId", "deviceUUID deviceName deviceType isBlocked")
        .lean();

        const currentTime = Date.now();
        const refreshExpiryMs = expiryTimeOfRefreshToken;

        const validDevices = sessions.reduce((acc, session) => {
            const issuedAt = new Date(session.jwtTokenIssuedAt).getTime();
            if (!issuedAt) return acc;

            const isExpired = (currentTime - issuedAt) > refreshExpiryMs;
            if (isExpired) return acc;

            const isCurrent =
                session.deviceId.deviceUUID.toString() === currentDeviceId.toString();

            acc.push({
                sessionStatus: isCurrent ? "Current Session" : "Active",
                deviceName: session.deviceId?.deviceName || "Unknown Device",
                deviceType: session.deviceId?.deviceType || "Unknown",
                isBlocked: session.deviceId?.isBlocked || false,
                lastLoginAt: session.lastLoginAt
            });

            return acc;
        }, []);

        validDevices.sort(
            (a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt)
        );

        return validDevices;

    } catch (err) {
        logWithTime(`❌ DB Error while filtering active sessions for ${user.userId}`);
        errorMessage(err);
        return null;
    }
};

module.exports = { getActiveSessionsService };
