const { updateUserBlockStatusService } = require("@services/internals/toggle-user-block-status.service");
const { AuthErrorTypes } = require("@configs/enums.config");
const {
    throwInternalServerError,
    throwDBResourceNotFoundError,
    throwConflictError,
    getLogIdentifiers
} = require("@/responses/common/error-handler.response");
const { toggleUserBlockSuccessResponse } = require("@/responses/success/index");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Helper to handle Block/Unblock (DRY Principle)
 */
const handleBlockToggle = async (req, res, shouldBlock) => {
    try {
        const adminId = req.body.adminId; // Admin Middleware se aayega
        const userId = req.body.userId; // Target User ID

        // 1. Service Call with admin context
        const result = await updateUserBlockStatusService(userId, shouldBlock, {
            adminId: adminId,
            req: req
        });

        // 2. Handle Result - Check Success BEFORE Logging
        if (result.success === false) {
            logWithTime(`⚠️ Block Action Skipped: User ${userId} is already ${shouldBlock ? "blocked" : "unblocked"}.`);
            return throwConflictError(res, result.message);
        }

        // 3. Log Success ONLY when action actually completed
        const action = shouldBlock ? "BLOCKED" : "UNBLOCKED";
        logWithTime(`👮 Admin (${adminId}) ${action} User (${userId}) from IP: ${req.ip} by Admin Panel Service`);

        return toggleUserBlockSuccessResponse(res, {adminId}, userId, result.message);

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