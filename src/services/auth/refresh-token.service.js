const { rotateRefreshToken } = require("./session-token.service");
const { verifyToken } = require("@utils/verify-token.util");
const { Token, AuthErrorTypes } = require("@configs/enums.config");

const performRefreshToken = async (refreshToken, device) => {

    let decoded;

    try {
        decoded = verifyToken(refreshToken, Token.REFRESH);
    } catch (err) {
        return {
            success: false,
            type: AuthErrorTypes.INVALID_TOKEN,
            message: "Invalid or expired refresh token."
        };
    }

    const { uid: userId, did: deviceUUID } = decoded;

    if (!userId || !deviceUUID) {
        return {
            success: false,
            type: AuthErrorTypes.INVALID_TOKEN,
            message: "Invalid refresh token payload."
        };
    }

    if (device.deviceUUID !== deviceUUID) {
        return {
            success: false,
            type: AuthErrorTypes.TOKEN_DEVICE_MISMATCH,
            message: "Refresh token does not belong to this device."
        };
    }

    const result = await rotateRefreshToken(userId, device);

    if (!result.success) {
        return {
            success: false,
            type: result.type || AuthErrorTypes.INVALID_TOKEN,
            message: result.message || "Token rotation failed."
        };
    }

    return {
        success: true,
        userId,
        newAccessToken: result.details.newAccessToken
    };
};

module.exports = {
    performRefreshToken
}