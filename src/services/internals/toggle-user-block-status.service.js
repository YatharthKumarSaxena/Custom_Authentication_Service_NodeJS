const { UserModel } = require("@models/user.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { AuthErrorTypes } = require("@configs/enums.config");
const { logSystemEvent } = require("@services/system/system-log.service");
const { SYSTEM_LOG_EVENTS, STATUS_TYPES, SERVICE_NAMES } = require("@configs/system-log-events.config");

/**
 * Service to toggle Block/Unblock status
 * @param {String} targetUserId - The ID of the user to block/unblock
 * @param {Boolean} shouldBlock - true to block, false to unblock
 * @param {Object} options - Additional context
 * @param {String} options.adminId - ID of admin performing the action
 * @param {Object} options.req - Express request object for context
 */
const updateUserBlockStatusService = async (targetUserId, shouldBlock, options = {}) => {
    
    // 1. Find the User
    const user = await UserModel.findOne({ userId: targetUserId }).lean();

    if (!user) {
        throw { 
            type: AuthErrorTypes.RESOURCE_NOT_FOUND, 
            message: `User with ID ${targetUserId} not found.` 
        };
    }

    if (user.isBlocked === shouldBlock) {
        return {
            success: false,
            message: `User is already ${shouldBlock ? "blocked" : "unblocked"}.`
        };
    }

    // 2. Update Status (Atomic Operation)
    await UserModel.updateOne(
        { _id: user._id },
        { $set: { isBlocked: shouldBlock } }
    );

    // 3. FORCE LOGOUT (If Blocking)
    // Agar hum user ko block kar rahe hain, to uske saare sessions invalidate karne honge.
    let sessionsTerminated = 0;
    if (shouldBlock) {
        const updateResult = await UserDeviceModel.updateMany(
            { userId: user._id },
            { 
                $set: { 
                    refreshToken: null,
                    lastLogoutAt: new Date()
                } 
            }
        );
        sessionsTerminated = updateResult.modifiedCount;
        logWithTime(`🚫 User (${targetUserId}) blocked & force logged out from all devices.`);
    } else {
        logWithTime(`✅ User (${targetUserId}) has been unblocked.`);
    }

    // 4. SYSTEM LOG - Track admin action
    const eventType = shouldBlock ? SYSTEM_LOG_EVENTS.USER_BLOCKED : SYSTEM_LOG_EVENTS.USER_UNBLOCKED;
    const action = shouldBlock ? "USER_BLOCK" : "USER_UNBLOCK";
    const status = STATUS_TYPES.SUCCESS;
    
    // Fire-and-forget system logging (don't await)
    logSystemEvent({
        eventType,
        action,
        description: shouldBlock 
            ? `User (${targetUserId}) blocked. ${sessionsTerminated} active sessions terminated.`
            : `User (${targetUserId}) unblocked.`,
        serviceName: SERVICE_NAMES.ADMIN_PANEL_SERVICE,
        status,
        targetId: targetUserId,
        executedBy: options.adminId || null,
        sourceService: SERVICE_NAMES.AUTH_SERVICE,
        req: options.req,
        metadata: {
            targetUserId,
            shouldBlock,
            sessionsTerminated
        }
    }).catch(err => {
        logWithTime(`⚠️ Failed to log system event for user block/unblock: ${err.message}`);
    });

    return {
        success: true,
        message: `User has been successfully ${shouldBlock ? "blocked" : "unblocked"}.`
    };
};

module.exports = { updateUserBlockStatusService };