// Modules & Configs
const { OK } = require("@configs/http-status.config");
const { toggleTwoFactorService } = require("@services/account-management/two-factor.service");
const { AuthErrorTypes } = require("@configs/enums.config");

// Error Handlers
const { 
    throwInternalServerError, 
    throwInvalidResourceError, 
    throwTooManyRequestsError,
    throwBadRequestError,
    getLogIdentifiers,
    throwAccessDeniedError
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { isAdminId } = require("@/utils/auth.util");

/**
 * Helper to handle the toggle request (DRY Principle)
 */
const handleTwoFactorToggle = async (req, res, shouldEnable) => {
    try {
        const user = req.user;
        const device = req.device;
        const { password } = req.body;

        if (isAdminId(user.userId)) {
            logWithTime(`❌ 2FA Toggle Blocked: Attempt to change 2FA for Super Admin ${user.userId}.`);
            return throwAccessDeniedError(res, "Modifications to Super Admin 2FA are not allowed.");
        }

        // Service Call
        const result = await toggleTwoFactorService(user, device, password, shouldEnable);

        return res.status(OK).json({
            success: true,
            message: result.message
        });

    } catch (err) {
        // 1. Locked (Rate Limit)
        if (err.type === AuthErrorTypes.LOCKED) {
            logWithTime(`❌ 2FA Toggle Blocked: User ${req.user.userId} is locked.`);
            return throwTooManyRequestsError(res, err.message);
        }

        // 2. Invalid Password
        if (err.type === AuthErrorTypes.INVALID_PASSWORD) {
            logWithTime(`❌ 2FA Toggle Failed: Invalid password for User ${req.user.userId}.`);
            return throwInvalidResourceError(res, "Password", err.message);
        }

        // 3. System Disabled Feature Error
        if (err.message.includes("disabled by system")) {
            return throwBadRequestError(res, err.message);
        }

        // 4. Internal Errors
        const identifiers = getLogIdentifiers(req);
        const action = shouldEnable ? "Enabling" : "Disabling";
        logWithTime(`❌ Internal Error while ${action} 2FA ${identifiers}`);
        return throwInternalServerError(res, err);
    }
};

// ==========================================
// 🚀 EXPORTED CONTROLLERS
// ==========================================

const enable2FA = async (req, res) => {
    return await handleTwoFactorToggle(req, res, true);
};

const disable2FA = async (req, res) => {
    return await handleTwoFactorToggle(req, res, false);
};

module.exports = {
    enable2FA,
    disable2FA
};