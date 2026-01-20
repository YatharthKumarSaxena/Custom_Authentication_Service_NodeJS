const { rotateRefreshToken } = require("./session-token.service");
const { verifyToken } = require("@utils/verify-token.util");
const { Token } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Main Orchestrator for Refresh Token
 * 
 * Flow:
 * 1. Verify incoming refresh token
 * 2. Extract userId and deviceUUID from token
 * 3. Call rotateRefreshToken to generate new tokens
 * 4. Return new access token
 */
const performRefreshToken = async (refreshToken, device) => {

    // ---------------------------------------------------------
    // STEP 1: Verify Refresh Token Structure
    // ---------------------------------------------------------
    let decoded;
    try {
        decoded = verifyToken(refreshToken, Token.REFRESH);
    } catch (err) {
        logWithTime(`❌ Invalid refresh token provided: ${err.message}`);
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    // ---------------------------------------------------------
    // STEP 2: Extract userId and deviceUUID from token
    // ---------------------------------------------------------
    const { uid: userId, did: deviceUUID } = decoded;

    if (!userId || !deviceUUID) {
        logWithTime(`❌ Refresh token missing required claims (uid/did)`);
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    // ---------------------------------------------------------
    // STEP 3: Validate Device UUID Match
    // ---------------------------------------------------------
    // Device from request should match device in token
    if (device.deviceUUID !== deviceUUID) {
        logWithTime(`⚠️ Device UUID mismatch. Token: ${deviceUUID}, Request: ${device.deviceUUID}`);
        throw new Error("REFRESH_TOKEN_MISMATCH");
    }

    // ---------------------------------------------------------
    // STEP 4: Rotate Refresh Token (Validate Session & Generate New Tokens)
    // ---------------------------------------------------------
    const result = await rotateRefreshToken(userId, device);

    if (!result.success) {
        logWithTime(`❌ Token rotation failed: ${result.error}`);
        throw new Error(result.error);
    }

    // ---------------------------------------------------------
    // STEP 5: Return New Access Token
    // ---------------------------------------------------------
    logWithTime(`✅ Token rotation successful for user (${userId}) on device (${deviceUUID})`);

    return {
        userId,
        newAccessToken: result.details.newAccessToken
    };
};

module.exports = { performRefreshToken };
