const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("@configs/token.config");
const { createToken } = require("@/utils/issue-token.util");
const { verifyToken } = require("@utils/verify-token.util");
const { Token } = require("@configs/enums.config");

/**
 * 🟢 Validates User & Device, handles Device Info Updates
 */
const validateSessionAndSyncDevice = async (userId, device) => {

    const { deviceUUID, deviceName, deviceType } = device;

    // 1. Fetch User
    const user = await UserModel.findById(userId).lean();
    if (!user) return { error: `User with ID ${userId} not found`, success: false };

    // 2. Fetch Device
    const deviceDoc = await DeviceModel.findOne({ deviceUUID });
    if (!deviceDoc) return { error: `Device with UUID ${deviceUUID} not found`, success: false };

    // 3. Fetch User-Device Mapping
    const userDevice = await UserDeviceModel.findOne({
        userId: user._id,
        deviceId: deviceDoc._id
    });

    if (!userDevice) return { error: `Session not found`, success: false };

    // 4. Sync Device Meta Data
    if (deviceName || deviceType) {
        let isModified = false;
        if (deviceName && deviceDoc.deviceName !== deviceName) {
            deviceDoc.deviceName = deviceName;
            isModified = true;
        }
        if (deviceType && deviceDoc.deviceType !== deviceType) {
            deviceDoc.deviceType = deviceType;
            isModified = true;
        }
        if (isModified) await deviceDoc.save();
    }

    return { success: true, details: { user, userDevice } };
}

/**
 * Handles Token Rotation
 */
const rotateRefreshToken = async (refreshToken, device) => {
    
    // 1. Verify Refresh Token
    let refreshDecoded;
    try {
        refreshDecoded = verifyToken(refreshToken, Token.REFRESH);
    } catch (err) {
        return { success: false, error: "Invalid Refresh Token" };
    }

    // 2. Validate Session
    // ⚠️ FIX: Pass proper object structure `{ deviceUUID: ... }`
    // Hum token ka 'did' use kar rahe hain device identify karne ke liye
    const sessionResult = await validateSessionAndSyncDevice(
        refreshDecoded.uid, 
        { ...device, deviceUUID: refreshDecoded.did } // Ensure UUID comes from token
    );

    if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
    };

    // ⚠️ FIX: Define userDevice variable properly
    const { userDevice, user } = sessionResult.details;

    // 3. Reuse Detection
    if (userDevice.refreshToken !== refreshToken) {
        await UserDeviceModel.deleteOne({ _id: userDevice._id });
        return { success: false, error: "Refresh Token reuse detected" };
    }

    // 4. Generate New Tokens
    const newAccessToken = createToken(refreshDecoded.uid, expiryTimeOfAccessToken, refreshDecoded.did);
    const newRefreshToken = createToken(refreshDecoded.uid, expiryTimeOfRefreshToken, refreshDecoded.did);

    // 5. Update DB
    userDevice.refreshToken = newRefreshToken;
    userDevice.jwtTokenIssuedAt = new Date();
    await userDevice.save();

    return {
        success: true,
        details: { newAccessToken, newRefreshToken, user, userDevice }
    };
};

module.exports = {
    validateSessionAndSyncDevice,
    rotateRefreshToken
};