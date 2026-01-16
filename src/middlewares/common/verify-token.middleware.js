const { 
    throwMissingFieldsError, 
    logMiddlewareError, 
    throwAccessDeniedError, 
    throwDBResourceNotFoundError, 
    throwSessionExpiredError,
    throwInternalServerError 
} = require("@/utils/error-handler.util");
const { extractAccessToken, extractRefreshToken } = require("@/utils/extract-token.util");
const { validateSessionAndSyncDevice, rotateRefreshToken } = require("@/services/auth/session-token.service");
const { verifyToken, decodeTokenUnsafe } = require("@utils/verify-token.util");
const { Token } = require("@configs/enums.config");
const { expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("@/configs/token.config");
const { buildAccessTokenHeaders } = require("@/utils/token-headers.util");
const { setRefreshTokenCookie } = require("@/services/auth/auth-cookie-service");
const { logWithTime } = require("@/utils/time-stamps.util");

const verifyTokenMiddleware = async (req, res, next) => {
    try {
        const accessToken = extractAccessToken(req);
        const refreshToken = extractRefreshToken(req);
        const device = req.device; // Scope fix: Available everywhere

        const missing = [];
        if (!accessToken) missing.push("Access token");
        if (!refreshToken) missing.push("Refresh token");

        if (missing.length) {
            logMiddlewareError("verifyToken", "Missing tokens", req);
            return throwMissingFieldsError(res, `Missing required token(s): ${missing.join(", ")}`);
        }

        let accessDecoded;
        let refreshDecoded;
        let user, userDevice;
        let accessDecodeSuccess = false;

        try {
            // ✅ Happy Path: Verify ACCESS token
            accessDecoded = verifyToken(accessToken, Token.ACCESS);

            // ✅ Logic 1: Stale-token detection (Replay Protection)
            const tokenAge = Date.now() - (accessDecoded.iat * 1000);
            if (tokenAge > expiryTimeOfAccessToken) {
                logMiddlewareError("verifyToken", "Expired access token presented beyond allowed age", req);
                return throwAccessDeniedError(res, "Invalid or expired access token");
            }

            if (device.deviceUUID !== accessDecoded.did) {
                logMiddlewareError("verifyToken", "Device UUID mismatch (access token)", req);
                return throwAccessDeniedError(res, "Device information mismatch");
            }

            accessDecodeSuccess = true;

        } catch (err) {
            // 🛑 Catch Block: Access Token Invalid/Expired

            // 1. Unsafe Decode to get UID for session check
            accessDecoded = decodeTokenUnsafe(accessToken);
            if (!accessDecoded) {
                logMiddlewareError("verifyToken", "Invalid access token format", req);
                return throwAccessDeniedError(res, "Invalid access token");
            }

            // 2. Validate Session BEFORE Rotation 
            const sessionResult = await validateSessionAndSyncDevice(accessDecoded.uid, device);
            if (!sessionResult.success) {
                logMiddlewareError("verifyToken", "Invalid Access Token Provided during decoding, no user-device session detected", req);
                return throwAccessDeniedError(res, "Invalid access token");
            }

            const { userDevice: currentDevice } = sessionResult.details;
            const tokenIssuedAt = new Date(currentDevice.jwtTokenIssuedAt).getTime();
            const currentTime = Date.now();

            // ✅ Logic 2: Stale Access Token Check
            if (currentTime - tokenIssuedAt <= expiryTimeOfAccessToken) {
                logMiddlewareError("verifyToken", "Stale Access Token Detected. Access token expired but still within valid window.", req);
                return throwAccessDeniedError(res, "Invalid access token");
            }

            // ✅ Logic 3: Double Expiry Check
            if (currentTime - tokenIssuedAt >= expiryTimeOfRefreshToken) {
                logMiddlewareError("verifyToken", "Both Access and Refresh tokens expired beyond issued-at window", req);
                return throwSessionExpiredError(res, "Both access and refresh tokens have expired. Please login again.");
            }

            // 🔄 Logic 4: Rotation Flow
            logMiddlewareError("verifyToken", "Access token expired or invalid — rotating", req);

            // ⚠️ FIX: Pass refreshToken & device (Service will verify refresh token)
            const tokenRotated = await rotateRefreshToken(refreshToken, device);
            
            if (!tokenRotated.success) {
                logMiddlewareError("verifyToken", "Refresh token invalid during rotation", req);
                return throwAccessDeniedError(res, tokenRotated.error);
            }

            // Set New Tokens
            const accessTokenData = buildAccessTokenHeaders(tokenRotated.details.newAccessToken);
            res.set(accessTokenData.headers);
            setRefreshTokenCookie(res, tokenRotated.details.newRefreshToken);
            logWithTime(`🔄 Tokens rotated for user ID: ${accessDecoded.uid} for device UUID: ${accessDecoded.did}`);

            // Populate user/device for next()
            user = tokenRotated.details.user;
            userDevice = tokenRotated.details.userDevice;
        }

        // ✅ Final Logic: If Access Token was valid (Not rotated)
        if (accessDecodeSuccess === true) {
            const sessionResult = await validateSessionAndSyncDevice(accessDecoded.uid, device);
            if (!sessionResult.success) {
                logMiddlewareError("verifyToken", "Invalid session/device mapping", req);
                return throwDBResourceNotFoundError(res, sessionResult.error);
            };

            ({ user, userDevice } = sessionResult.details);

            // Verify Refresh Token consistency
            try {
                refreshDecoded = verifyToken(refreshToken, Token.REFRESH);
                const tokenAge = Date.now() - (refreshDecoded.iat * 1000);
                if (tokenAge > expiryTimeOfRefreshToken) {
                    return throwAccessDeniedError(res, "Invalid or expired refresh token");
                }
            } catch (e) {
                return throwAccessDeniedError(res, "Invalid refresh token");
            }
        }

        // User ID Mismatch Check
        // Note: accessDecoded might be from unsafe decode if rotation happened
        const currentUid = accessDecoded ? accessDecoded.uid : user.userId;
        const currentRefreshUid = refreshDecoded ? refreshDecoded.uid : (decodeTokenUnsafe(refreshToken)).uid;

        if (currentRefreshUid !== currentUid) {
            logMiddlewareError("verifyToken", "User ID mismatch between tokens", req);
            return throwAccessDeniedError(res, "Token user mismatch");
        }

        req.user = user;
        req.userDevice = userDevice;
        return next();

    } catch (error) {
        logMiddlewareError("verifyToken", "Internal server error during token verification", req);
        return throwInternalServerError(res, error);
    }
};

module.exports = { verifyTokenMiddleware };