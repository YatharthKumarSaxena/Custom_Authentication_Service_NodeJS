const { UserModel } = require("@models/user.model");
const { DeviceModel } = require("@models/device.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("@configs/token.config");
const { createToken } = require("@/utils/issue-token.util");
const { verifyToken } = require("@utils/verify-token.util");
const { Token } = require("@configs/enums.config");

/**
 * Validates User & Device, handles Device Info Updates
 */
const validateSessionAndSyncDevice = async (userId, device) => {

    const { deviceUUID, deviceName, deviceType } = device;

    // 1. Fetch User
    const user = await UserModel.findOne({ userId: userId }).lean();
    if (!user) return { error: `User with ID ${userId} not found`, success: false };

    // 2. Fetch Device
    const deviceDoc = await DeviceModel.findOne({ deviceUUID }).lean();
    if (!deviceDoc) return { error: `Device with UUID ${deviceUUID} not found`, success: false };

    // 3. Fetch User-Device Mapping
    const userDevice = await UserDeviceModel.findOne({
        userId: user._id,
        deviceId: deviceDoc._id
    }).select("+refreshToken");

    if (!userDevice) return { error: `Session not found`, success: false };

    if (!userDevice.refreshToken) {
        return { error: `Session is terminated. Please login again.`, success: false };
    }
    // 4. Sync Device Meta Data
    if (deviceName || deviceType) {
        const updateFields = {};
        if (deviceName && deviceDoc.deviceName !== deviceName) {
            updateFields.deviceName = deviceName;
        }
        if (deviceType && deviceDoc.deviceType !== deviceType) {
            updateFields.deviceType = deviceType;
        }
        if (Object.keys(updateFields).length > 0) {
            await DeviceModel.updateOne(
                { _id: deviceDoc._id },
                { $set: updateFields }
            );
        }
    }

    return { success: true, details: { user, userDevice } };
}

/**
 * Handles Refresh Token Rotation
 * Single source of truth for:
 * - Session validation
 * - Stale checks
 * - Token rotation
 */
const rotateRefreshToken = async (userId, device) => {

    // 1. Fetch session using userId + device
    const sessionResult = await validateSessionAndSyncDevice(userId, device);
    if (!sessionResult.success) {
        return { success: false, error: sessionResult.error };
    }

    const { userDevice, user } = sessionResult.details;
    const refreshToken = userDevice.refreshToken;

    // 2. Verify Refresh Token
    let refreshDecoded;
    try {
        refreshDecoded = verifyToken(refreshToken, Token.REFRESH);
    } catch (err) {
        return { success: false, error: "Invalid refresh token" };
    }

    // 3. Stale Token Check
    const tokenIssuedAt = new Date(userDevice.jwtTokenIssuedAt).getTime();
    const currentTime = Date.now();

    if (currentTime - tokenIssuedAt <= expiryTimeOfAccessToken * 1000) {
        return { success: false, error: "STALE_ACCESS_TOKEN" };
    }

    // 4. Double Expiry Check
    if (currentTime - tokenIssuedAt >= expiryTimeOfRefreshToken * 1000) {
        return {
            success: false,
            error: "Session expired. Please login again."
        };
    }

    if (
        refreshDecoded.uid !== userId ||
        refreshDecoded.did !== device.deviceUUID
    ) {
        return { success: false, error: "REFRESH_TOKEN_MISMATCH" };
    }

    // 5. Generate New Tokens
    const newAccessToken = createToken(
        userId,
        expiryTimeOfAccessToken,
        device.deviceUUID
    );

    const newRefreshToken = createToken(
        userId,
        expiryTimeOfRefreshToken,
        device.deviceUUID
    );

    // 6. Update DB
    await UserDeviceModel.updateOne(
        { _id: userDevice._id },
        {
            $set: {
                refreshToken: newRefreshToken,
                jwtTokenIssuedAt: new Date()
            }
        }
    );

    return {
        success: true,
        details: {
            newAccessToken,
            user,
            userDevice
        }
    };
};

module.exports = {
    validateSessionAndSyncDevice,
    rotateRefreshToken
};