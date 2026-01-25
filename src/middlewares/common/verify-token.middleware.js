const {
    throwMissingFieldsError,
    logMiddlewareError,
    throwAccessDeniedError,
    throwDBResourceNotFoundError,
    throwSessionExpiredError,
    throwInternalServerError
} = require("@/utils/error-handler.util");
const { extractAccessToken } = require("@/utils/extract-token.util");
const { validateSessionAndSyncDevice, rotateRefreshToken } = require("@/services/auth/session-token.service");
const { verifyToken, decodeTokenUnsafe } = require("@utils/verify-token.util");
const { Token } = require("@configs/enums.config");
const { expiryTimeOfAccessToken, expiryTimeOfRefreshToken } = require("@/configs/token.config");
const { buildAccessTokenHeaders } = require("@/utils/token-headers.util");
const { logWithTime } = require("@/utils/time-stamps.util");

const verifyTokenMiddleware = async (req, res, next) => {
    try {
        const accessToken = extractAccessToken(req);
        const device = req.device; // Scope fix: Available everywhere

        const missing = [];
        if (!accessToken) missing.push("Access token");

        if (missing.length) {
            logMiddlewareError("verifyToken", "Missing tokens", req);
            return throwMissingFieldsError(res, `Missing required token(s): ${missing.join(", ")}`);
        }

        let accessDecoded;
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

            // Check Stale Access Token 

        } catch (err) {
            // 🛑 Catch Block: Access Token Invalid/Expired

            // 1. Unsafe Decode to get UID for session check
            accessDecoded = decodeTokenUnsafe(accessToken);
            if (!accessDecoded) {
                logMiddlewareError("verifyToken", "Invalid access token format", req);
                return throwAccessDeniedError(res, "Invalid access token");
            }

            // 2. Validate session to get userDevice for token age check
            const sessionResult = await validateSessionAndSyncDevice(accessDecoded.uid, device);
            if (!sessionResult.success) {
                logMiddlewareError("verifyToken", "Invalid session during token rotation", req);
                return throwDBResourceNotFoundError(res, sessionResult.error);
            }

            userDevice = sessionResult.details.userDevice;

            // 3. Token age validation
            const tokenAge = Date.now() - new Date(userDevice.jwtTokenIssuedAt).getTime();
            const buffer = 5 * 1000; // 5 seconds

            if (tokenAge < -buffer || tokenAge > buffer) {
                logMiddlewareError("verifyToken", "Invalid token age detected during access token failure", req);
                return throwAccessDeniedError(res, "Invalid Access Token");
            }

            // 4. Rotate refresh token
            const tokenRotated = await rotateRefreshToken(accessDecoded.uid, device);

            if (!tokenRotated.success) {
                logMiddlewareError("verifyToken", "Refresh token invalid during rotation", req);
                return throwAccessDeniedError(res, tokenRotated.error);
            }

            // Set New Tokens
            const accessTokenData = buildAccessTokenHeaders(tokenRotated.details.newAccessToken);
            res.set(accessTokenData.headers);
            logWithTime(`🔄 Tokens rotated for user ID: ${accessDecoded.uid} for device UUID: ${accessDecoded.did}`);

            // Populate user/device for next()
            user = tokenRotated.details.user;
            userDevice = tokenRotated.details.userDevice;
            return next();
        }

        // ✅ Final Logic: If Access Token was valid (Not rotated)
        if (accessDecodeSuccess === true) {
            const sessionResult = await validateSessionAndSyncDevice(accessDecoded.uid, device);
            if (!sessionResult.success) {
                logMiddlewareError("verifyToken", "Invalid session/device mapping", req);
                return throwDBResourceNotFoundError(res, sessionResult.error);
            };

            ({ user, userDevice } = sessionResult.details);

            const tokenIssuedAt = new Date(userDevice.jwtTokenIssuedAt).getTime();
            const currentTime = Date.now();
            const jwtTokenIssuedAt = userDevice.jwtTokenIssuedAt;

            // Extra Safety Check: Ensure Access Token is not stale
            if (currentTime - tokenIssuedAt >= expiryTimeOfAccessToken) {
                logMiddlewareError("verifyToken", "Access token is stale despite being valid", req);
                return throwAccessDeniedError(res, "Stale access token detected");
            }

            if (currentTime - jwtTokenIssuedAt >= expiryTimeOfRefreshToken) {
                logMiddlewareError("verifyToken", "Session expired during access token validation", req);
                return throwSessionExpiredError(res, "Session has expired. Please login again.");
            }

            const tokenAge = Date.now() - new Date(userDevice.jwtTokenIssuedAt).getTime();
            const buffer = 5 * 1000; // 5 seconds

            if (tokenAge < -buffer || tokenAge > buffer) {
                logMiddlewareError("verifyToken", "Invalid token age detected despite valid access token", req);
                return throwAccessDeniedError(res, "Invalid Access Token");
            }
        }

        // User ID Mismatch Check
        // Note: accessDecoded might be from unsafe decode if rotation happened
        const currentUid = accessDecoded.uid;
        const currentRefreshUid = user.userId;

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