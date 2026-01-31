const { UserModel } = require("@models/user.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("@utils/time-stamps.util");
const { AuthErrorTypes } = require("@configs/enums.config");

/**
 * Service to toggle Block/Unblock status
 * @param {String} targetUserId - The ID of the user to block/unblock
 * @param {Boolean} shouldBlock - true to block, false to unblock
 */
const updateUserBlockStatusService = async (targetUserId, shouldBlock) => {
    
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
    if (shouldBlock) {
        await UserDeviceModel.updateMany(
            { userId: user._id },
            { 
                $set: { 
                    refreshToken: null,
                    lastLogoutAt: new Date()
                } 
            }
        );
        logWithTime(`🚫 User (${targetUserId}) blocked & force logged out from all devices.`);
    } else {
        logWithTime(`✅ User (${targetUserId}) has been unblocked.`);
    }

    return {
        success: true,
        message: `User has been successfully ${shouldBlock ? "blocked" : "unblocked"}.`
    };
};

module.exports = { updateUserBlockStatusService };