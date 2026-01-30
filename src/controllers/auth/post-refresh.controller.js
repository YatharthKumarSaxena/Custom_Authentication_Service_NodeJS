/**
 * 🔄 Post-Refresh Token Controller
 */

const { performPostRefresh } = require("@services/auth/post-refresh.service");
const { OK } = require("@configs/http-status.config");
const { AuthErrorTypes } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { microserviceConfig } = require("@configs/microservice.config");

// Error Handlers
const { 
    throwInternalServerError, 
    throwSpecificInternalServerError,
    throwInvalidResourceError,
    throwBadRequestError,
    getLogIdentifiers
} = require("@utils/error-handler.util");
const { DeviceModel } = require("@models/index");

const postRefresh = async (req, res) => {
    try {
        const { refreshToken, deviceUUID } = req.body;
        const device = await DeviceModel.findOne({ deviceUUID: deviceUUID });

        if (!device) {
            return throwInvalidResourceError(res, "Device", "Device not found");
        }

        // ---------------------------------------------------------
        // 1. INPUT VALIDATION
        // ---------------------------------------------------------
        if (!refreshToken) {
            return throwBadRequestError(res, "Refresh token is required");
        }

        if (!device || !device.deviceUUID) {
            return throwBadRequestError(res, "Device information is required");
        }

        // ---------------------------------------------------------
        // 2. CALL SERVICE
        // ---------------------------------------------------------
        const result = await performPostRefresh(refreshToken, device);

        // ---------------------------------------------------------
        // 3. HANDLE FAILURES
        // ---------------------------------------------------------
        if (!result.success) {
            
            // Case A: Invalid/Expired/Mismatch Token
            if (result.type === AuthErrorTypes.INVALID_TOKEN || 
                result.type === AuthErrorTypes.SESSION_NOT_FOUND ||
                result.type === AuthErrorTypes.UNAUTHORIZED ||
                result.type === AuthErrorTypes.TOKEN_REFRESH) {
                
                return throwInvalidResourceError(
                    res, 
                    "Refresh Token",
                    result.message
                );
            }

            // Case B: System Errors
            if (result.type === AuthErrorTypes.SERVER_ERROR) {
                return throwSpecificInternalServerError(res, "Failed to refresh tokens");
            }

            // Default fallback
            return throwBadRequestError(res, result.message);
        }

        // ---------------------------------------------------------
        // 4. SUCCESS RESPONSE
        // ---------------------------------------------------------
        const mode = microserviceConfig.enabled ? 'microservice' : 'monolithic';
        
        logWithTime(
            `✅ [${mode.toUpperCase()}] Post-refresh completed for user (${result.userId.substring(0, 8)}...) on device (${device.deviceUUID.substring(0, 8)}...)`
        );

        // No need to set Access Token in Headers as this is an Internal API Call by Other Services
        return res.status(OK).json({
            success: true,
            message: "Tokens refreshed successfully",
            accessToken: result.accessToken
        });

    } catch (err) {
        // Only catch totally unexpected runtime errors here
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Post-Refresh Fatal Error ${identifiers}:`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { postRefresh };