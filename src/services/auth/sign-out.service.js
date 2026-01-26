const ms = require("ms");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { AUTH_LOG_EVENTS } = require("@configs/auth-log-events.config");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { UserDeviceModel } = require("@models/user-device.model");

const signOutService = async (user, device, userDevice) => {

    const now = new Date();

    const jwtIssuedAt = userDevice.jwtTokenIssuedAt
        ? new Date(userDevice.jwtTokenIssuedAt).getTime()
        : null;

    // --------------------------------------------------
    // 1️⃣ Already logged out
    // --------------------------------------------------
    if (!userDevice.refreshToken) {
        return {
            success: true,
            alreadyLoggedOut: true,
            message: "You are already logged out from this device."
        };
    }

    // --------------------------------------------------
    // 2️⃣ Invalidate session (CRITICAL)
    // --------------------------------------------------
    
    await UserDeviceModel.updateOne(
        { _id: userDevice._id },
        {
            $set: {
                refreshToken: null,
                lastLogoutAt: now
            }
        }
    );

    // --------------------------------------------------
    // 3️⃣ Audit log (always)
    // --------------------------------------------------
    logAuthEvent(
        user,
        device,
        AUTH_LOG_EVENTS.LOGOUT_SPECIFIC_DEVICE,
        "User signed out manually.",
        null
    );

    // --------------------------------------------------
    // 4️⃣ Expiry info (optional)
    // --------------------------------------------------
    let sessionExpired = false;

    if (jwtIssuedAt) {
        const expiryMs = ms(expiryTimeOfRefreshToken);

        if (Date.now() > jwtIssuedAt + expiryMs) {
            sessionExpired = true;
        }
    }

    return {
        success: true,
        sessionExpired,
        message: sessionExpired
            ? "Session had already expired. You have been logged out."
            : "Signed out successfully."
    };
};

module.exports = { signOutService };
