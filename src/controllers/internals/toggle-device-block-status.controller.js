const { blockDeviceService, unblockDeviceService } = require("@services/internals/toggle-device-block-status.service");
const { AuthErrorTypes } = require("@configs/enums.config");

// Error Handlers
const {
    throwInternalServerError,
    throwDBResourceNotFoundError,
    throwAccessDeniedError,
    throwConflictError,
    throwBadRequestError,
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");
const { toggleDeviceBlockSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Controller to Block a Device
 * Accessible only by Admins via Internal API
 */
const blockDevice = async (req, res) => {
    try {
        const { deviceUUID, adminId } = req.body;

        // 2. Service Call with request context
        // Pass Admin ID and request for logging purposes inside service
        const result = await blockDeviceService(deviceUUID, adminId, { req });

        // 3. Handle Result - Check Success BEFORE Responding
        if (result.success === false) {
            logWithTime(`⚠️ Block Action Skipped: Device ${deviceUUID} is already blocked.`);
            return throwConflictError(res, result.message);
        }

        // 4. Log Success ONLY when action actually completed
        logWithTime(`🚫 Device (${deviceUUID}) blocked by Admin (${adminId}).`);

        return toggleDeviceBlockSuccessResponse(res, { adminId }, deviceUUID, result.message);

    } catch (err) {
        
        // ERROR HANDLING 

        // A. Device Not Found (404)
        if (err.type === AuthErrorTypes.RESOURCE_NOT_FOUND) {
            return throwDBResourceNotFoundError(res, err.message);
        }

        // B. Security Blocks (Whitelist / Trusted / Active Admin) (403)
        if (err.type === AuthErrorTypes.FORBIDDEN) {
            logWithTime(`⚠️ Admin Block Action Denied: ${err.message}`);
            return throwAccessDeniedError(res, err.message);
        }

        // C. Internal Server Error (500)
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error in blockDevice controller ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

const unblockDevice = async (req, res) => {
    try {
        // Admin Middleware se populated user
        const { deviceUUID, adminId } = req.body; 

        // 1. Validation
        if (!deviceUUID) {
            return throwBadRequestError(res, "Target Device UUID is required.");
        }

        // 2. Service Call with request context
        const result = await unblockDeviceService(deviceUUID, adminId, { req });
      
        // 3. Handle Result - Check Success BEFORE Responding
        if (result.success === false) {
            logWithTime(`⚠️ Unblock Action Skipped: Device ${deviceUUID} is already unblocked.`);
            return throwConflictError(res, result.message);
        }

        // 4. Log Success ONLY when action actually completed
        logWithTime(`✅ Device (${deviceUUID}) unblocked by Admin (${adminId}).`);

        return toggleDeviceBlockSuccessResponse(res, { adminId }, deviceUUID, result.message);

    } catch (err) {
        
        // ERROR HANDLING   

        // A. Device Not Found (404)
        if (err.type === AuthErrorTypes.RESOURCE_NOT_FOUND) {
            return throwDBResourceNotFoundError(res, err.message);
        }

        // B. Internal Server Error (500)
        const identifiers = getLogIdentifiers(req);
        logWithTime(`❌ Error in unblockDevice controller ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

module.exports = { blockDevice, unblockDevice };