const { UserDeviceModel } = require("@models/user-device.model");
const { usersPerDevice, deviceThreshold, ENABLE_DEVICE_SOFT_REPLACE } = require("@configs/security.config");
const { UserTypes, AuthErrorTypes } = require("@configs/enums.config");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { logWithTime } = require("@/utils/time-stamps.util");

const loginPolicyChecker = async ({ user, deviceId }) => {

    const validSessionSince = new Date(Date.now() - expiryTimeOfRefreshToken);

    // -------------------------------------------------
    // 1️⃣ USERS PER DEVICE LIMIT
    // -------------------------------------------------
    const uniqueUsersOnDevice = await UserDeviceModel.distinct("userId", {
        deviceId,
        refreshToken: { $ne: null },
        jwtTokenIssuedAt: { $gte: validSessionSince }
    });

    if (uniqueUsersOnDevice.length >= usersPerDevice) {

        const alreadyExists = uniqueUsersOnDevice.some(
            id => id.toString() === user._id.toString()
        );

        if (!alreadyExists) {
            return {
                allowed: false,
                type: AuthErrorTypes.DEVICE_USER_LIMIT_REACHED,
                message: `Max ${usersPerDevice} accounts allowed on this device.`
            };
        }
    }

    // -------------------------------------------------
    // 2️⃣ DEVICE THRESHOLD PER USER
    // -------------------------------------------------
    const allowedLimit =
        user.userType === UserTypes.ADMIN
            ? deviceThreshold.ADMIN
            : deviceThreshold.CUSTOMER;

    const activeDevices = await UserDeviceModel.find({
        userId: user._id,
        refreshToken: { $ne: null },
        jwtTokenIssuedAt: { $gte: validSessionSince },
        deviceId: { $ne: deviceId }
    }).sort({ jwtTokenIssuedAt: 1 }); // 👈 oldest first

    if (activeDevices.length + 1 > allowedLimit) {

        // -------------------------------------------------
        // ❌ STRICT MODE
        // -------------------------------------------------
        if (!ENABLE_DEVICE_SOFT_REPLACE) {
            return {
                allowed: false,
                type: AuthErrorTypes.SESSION_LIMIT_REACHED,
                message: `You can only be active on ${allowedLimit} devices.`
            };
        }

        // -------------------------------------------------
        // 🔁 SOFT REPLACE MODE
        // -------------------------------------------------
        const oldestSession = activeDevices[0];

        await UserDeviceModel.updateOne(
            { _id: oldestSession._id },
            {
                $set: {
                    refreshToken: null,
                    jwtTokenIssuedAt: null,
                    lastLogoutAt: new Date()
                }
            }
        );

        logWithTime(
            `🔁 Soft replaced device session | user=${user.userId}`
        );
    }

    // -------------------------------------------------
    // ✅ PASSED
    // -------------------------------------------------
    logWithTime(`✅ Login policy check passed for user ${user.userId}.`);

    return { allowed: true };
};

module.exports = { loginPolicyChecker };
