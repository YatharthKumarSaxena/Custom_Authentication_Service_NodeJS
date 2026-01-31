// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { blockDeviceService, unblockDeviceService } = require("@services/internals/toggle-device-block-status.service");
const { AuthErrorTypes } = require("@configs/enums.config");

// Error Handlers
const {
    throwInternalServerError,
    throwDBResourceNotFoundError,
    throwAccessDeniedError,
    throwConflictError,
    getLogIdentifiers
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Controller to Block a Device
 * Accessible only by Admins via Internal API
 */
const blockDevice = async (req, res) => {
    try {
        // Admin Middleware se req.admin ya req.user (as Admin) aayega
        const admin = req.foundUser;
        const { deviceUUID } = req.body;

        // 2. Service Call
        // Pass Admin ID for logging purposes inside service
        const result = await blockDeviceService(deviceUUID, admin.adminId);

        // 3. Success Response
        // Note: Service ke andar already deep logging ho rahi hai, 
        // par controller level par bhi ek confirmation log achha rehta hai.
        logWithTime(`✅ Admin (${admin.adminId}) successfully blocked device: ${deviceUUID}`);

        if (result.success === false) {
            logWithTime(`⚠️ Block Action Skipped: Device ${deviceUUID} is already blocked.`);
            return throwConflictError(res, result.message);
        }

        return res.status(OK).json({
            success: true,
            message: result.message
        });

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
        const admin = req.admin; 
        const { deviceUUID } = req.body; 

        // 1. Validation
        if (!deviceUUID) {
            return throwBadRequestError(res, "Target Device UUID is required.");
        }

        // 2. Service Call
        const result = await unblockDeviceService(deviceUUID, admin.adminId);
      
        // 3. HANDLE CONFLICT (Already Unblocked) 
        
        // Agar service ne { success: false } diya matlab device already unblocked tha
        if (result.success === false) {
            logWithTime(`⚠️ Unblock Action Skipped: Device ${deviceUUID} is already unblocked.`);
            return throwConflictError(res, result.message);
        }

        // 4. Success Response
        logWithTime(`✅ Admin (${admin.adminId}) successfully unblocked device: ${deviceUUID}`);

        return res.status(OK).json({
            success: true,
            message: result.message
        });

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