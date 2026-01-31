const { OK } = require("@configs/http-status.config");
const { updateUserBlockStatusService } = require("@services/internals/toggle-user-block-status.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const {
    throwInternalServerError,
    throwDBResourceNotFoundError,
    getLogIdentifiers
} = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Helper to handle Block/Unblock (DRY Principle)
 */
const handleBlockToggle = async (req, res, shouldBlock) => {
    try {
        const admin = req.admin; // Admin Middleware se aayega
        const userId = req.foundUser.userId; // Target User ID

        // 1. Service Call
        const result = await updateUserBlockStatusService(userId, shouldBlock);

        // 2. Logging with Admin Context
        const action = shouldBlock ? "BLOCKED" : "UNBLOCKED";

        // Admin ID log kar rahe hain taaki pata chale kisne block kiya
        logWithTime(`👮 Admin (${admin.adminId}) ${action} User (${userId}) from IP: ${req.ip} by Admin Panel Service`);

        if (result.success === false) {
            logWithTime(`⚠️ Block Action Skipped: User ${userId} is already ${shouldBlock ? "blocked" : "unblocked"}.`);
            return throwConflictError(res, result.message);
        }

        return res.status(OK).json({
            success: true,
            message: result.message
        });

    } catch (err) {
        if (err.type === AuthErrorTypes.RESOURCE_NOT_FOUND) {
            return throwDBResourceNotFoundError(res, `User with ID ${req.foundUser.userId}.`);
        }

        const identifiers = getLogIdentifiers(req); // Contains Device/IP info
        logWithTime(`❌ Admin Action Failed ${identifiers}: ${err.message}`);
        return throwInternalServerError(res, err);
    }
};

// EXPORTED CONTROLLERS

const blockUser = async (req, res) => {
    return await handleBlockToggle(req, res, true);
};

const unblockUser = async (req, res) => {
    return await handleBlockToggle(req, res, false);
};

module.exports = {
    blockUser,
    unblockUser
};