const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("./time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");

const loginTheUserCore = async (user, deviceId, refreshToken) => {
    try {
        const device = await UserDeviceModel.findOneAndUpdate(
            { userId: user._id, deviceId },
            {
                $set: {
                    refreshToken,
                    jwtTokenIssuedAt: new Date(),
                    lastLoginAt: new Date()
                },
                $inc: { loginCount: 1 },
                $setOnInsert: { firstSeenAt: new Date() }
            },
            { upsert: true, new: true, rawResult: true }
        );

        if (!device.lastErrorObject.updatedExisting) {
            // 🟢 FIRST TIME DEVICE
            logWithTime(`🆕 New device registered for user (${user.userId})`);
        } else {
            // 🟡 EXISTING DEVICE LOGIN
            logWithTime(`🔁 Login from existing device for user (${user.userId})`);
        }
        return device.value;
    } catch (err) {
        logWithTime(`❌ Internal Error occurred while logging in the User (${user.userId}) on device (${deviceId})`);
        errorMessage(err);
        return null;
    }
};

const logoutUserCompletelyCore = async (user) => {
    try {
        // Step 1: Fetch all active devices for this user
        const devices = await UserDeviceModel.find({ userId: user._id, refreshToken: { $ne: null } });

        let allDevicesLoggedOut = true;

        for (const device of devices) {
            try {
                device.refreshToken = null;
                device.jwtTokenIssuedAt = null;
                device.lastLogoutAt = new Date();
                await device.save();
            } catch (err) {
                allDevicesLoggedOut = false;
                logWithTime(`⚠️ Failed to logout device (${device._id}) for user (${user.userId})`);
            }
        }

        if (!allDevicesLoggedOut) {
            logWithTime(`⚠️ Some devices for user (${user.userId}) could not be logged out.`);
            return false; // avoid updating core flags if not all devices logged out
        }

        // Step 2: Update user core flags only after all devices are logged out
        user.refreshToken = null;
        user.jwtTokenIssuedAt = null;
        user.isVerified = false;
        if (user.devices && user.devices.info) user.devices.info = [];
        await user.save();

        logWithTime(`✅ User (${user.userId}) logged out from all devices successfully.`);
        return true;

    } catch (err) {
        logWithTime(`❌ Internal error while logging out user (${user.userId}) from all devices`);
        errorMessage(err);
        return false;
    }
};

module.exports = {
    logoutUserCompletelyCore,
    loginTheUserCore
}