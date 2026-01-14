const { UserDeviceModel } = require("@models/user-device.model");
const { logWithTime } = require("./time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");

/**
 * Updates the User-Device mapping with the new Refresh Token.
 * NOTE: Caller MUST pass deviceObjectId (MongoDB _id), NOT deviceUUID.
 */
const loginTheUserCore = async (user, deviceObjectId, refreshToken, options = {}) => {
    try {
        const { session } = options;

        // ✅ FIX: Using 'upsert' here ensures record exists with Token.
        // We use deviceObjectId (Mongo ID) because Schema links to Device Collection.
        const deviceMapping = await UserDeviceModel.findOneAndUpdate(
            { userId: user._id, deviceId: deviceObjectId },
            {
                $set: {
                    refreshToken,
                    jwtTokenIssuedAt: new Date(),
                    lastLoginAt: new Date()
                },
                $inc: { loginCount: 1 },
                $setOnInsert: { firstSeenAt: new Date() }
            },
            { upsert: true, new: true, rawResult: true, session: session } // ✅ Session Passed
        );

        if (!deviceMapping.lastErrorObject.updatedExisting) {
            logWithTime(`🆕 First-time login recorded for user (${user.userId}) on this device.`);
        } else {
            logWithTime(`🔁 Token refreshed for user (${user.userId}) on existing device.`);
        }
        
        return deviceMapping.value;

    } catch (err) {
        logWithTime(`❌ Error inside loginTheUserCore for User (${user.userId})`);
        errorMessage(err);
        // Throw error to trigger Transaction Rollback in parent
        throw err; 
    }
};

/**
 * Logs out user from ALL devices and clears User flags.
 * Atomic Transaction Safe.
 */
const logoutUserCompletelyCore = async (user, options = {}) => {
    try {
        const { session } = options;

        // ✅ Step 1: Bulk Update (Much faster & safer than for-loop)
        // Sare devices jahan token null nahi hai, unhe null kar do
        const updateResult = await UserDeviceModel.updateMany(
            { userId: user._id, refreshToken: { $ne: null } },
            { 
                $set: { 
                    refreshToken: null, 
                    jwtTokenIssuedAt: null, 
                    lastLogoutAt: new Date() 
                } 
            },
            { session: session } // ✅ Session Passed
        );

        logWithTime(`ℹ️ Cleared tokens for ${updateResult.modifiedCount} devices.`);

        // ✅ Step 2: Update User Core Flags
        user.refreshToken = null;
        user.jwtTokenIssuedAt = null;
        user.isVerified = false; // Logic retained as per your request
        
        if (user.devices && user.devices.info) {
            user.devices.info = [];
        }

        // ✅ Save User with Session
        await user.save({ session });

        logWithTime(`✅ User (${user.userId}) core flags reset successfully.`);
        return true;

    } catch (err) {
        logWithTime(`❌ Error inside logoutUserCompletelyCore for User (${user.userId})`);
        errorMessage(err);
        // Return false or Throw error based on preference. 
        // Returning false causes manual rollback in parent. Throwing handles it automatically.
        // Here we return false to match your existing flow check.
        return false; 
    }
};

module.exports = {
    logoutUserCompletelyCore,
    loginTheUserCore
};