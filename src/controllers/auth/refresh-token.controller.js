// Modules & Configs
const { performRefreshToken } = require("@services/auth/refresh-token.service");
const { buildAccessTokenHeaders } = require("@utils/token-headers.util");
const { logWithTime } = require("@utils/time-stamps.util");

// Error Handlers
const { 
    throwInternalServerError, 
    throwInvalidResourceError,
    throwBadRequestError, 
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");

const { refreshTokenSuccessResponse } = require("@/responses/success/index");

/**
 * Refresh Token Controller
 * Handles POST /refresh API
 * Takes refreshToken from request body
 * Returns new access token in headers
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const device = req.device;

        // 1. VALIDATION
        
        if (!refreshToken) {
            return throwBadRequestError(res, "Refresh token is required");
        }
      
        // 2. ORCHESTRATION (Call Service)
        
        const result = await performRefreshToken(refreshToken, device);
        
        // 3. ACCESS TOKEN GENERATION (Response Header)
        
        // New access token received from service
        const headers = buildAccessTokenHeaders(result.newAccessToken);

        if (!headers) {
            throw new Error("Failed to generate or set access token headers.");
        }

        // Set Headers
        res.set(headers);
        
        // 4. SUCCESS RESPONSE
        
        return refreshTokenSuccessResponse(res, result.userId, device.deviceUUID);

    } catch (err) {
        
        // ERROR HANDLING
                
        // 1. Unauthorized Errors (Invalid/Expired Token)
        if (err.message === "INVALID_REFRESH_TOKEN" || 
            err.message === "REFRESH_TOKEN_MISMATCH" ||
            err.message === "SESSION_NOT_FOUND" ||
            err.message === "Invalid refresh token" ||
            err.message === "Session expired. Please login again.") {
            return throwInvalidResourceError(res,"Refresh Token", err.message || "Invalid or expired refresh token. Please login again.");
        }

        // 2. Stale Token (Access token still valid)
        if (err.message === "STALE_ACCESS_TOKEN") {
            return throwBadRequestError(res, "Access token is still valid. Refresh not needed.");
        }

        // 3. Unknown/Internal Errors (500)
        const getIdentifiers = getLogIdentifiers(req);
        logWithTime(`❌ Refresh Token Error ${getIdentifiers}:`); 
        return throwInternalServerError(res, err);
    }
}

module.exports = { refreshToken };
