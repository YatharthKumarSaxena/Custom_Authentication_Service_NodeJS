const { logWithTime } = require("@utils/time-stamps.util");
const { logAuthEvent } = require("@/services/audit/auth-audit.service");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { syncDeviceData, syncUserDeviceMapping } = require("./device.service");
const { errorMessage } = require("@utils/error-handler.util");
const { UserDeviceModel } = require("@models/user-device.model");
const mongoose = require("mongoose");
const { UserModel } = require("@models/user.model");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");


/**
 * Updates the User-Device mapping with the new Refresh Token.
 * NOTE: Caller MUST pass deviceObjectId (MongoDB _id), NOT deviceUUID.
 */

const loginTheUserCore = async (user, deviceObjectId, refreshToken, options = {}) => {
    try {
        const { session } = options;

        // ✅ FIX: Using 'upsert' here ensures record exists with Token.
        // We use deviceObjectId (Mongo ID) because Schema links to Device Collection.
        // NOTE: rawResult removed - MongoDB doesn't return lastErrorObject in transactions
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
            { upsert: true, new: true, session: session } // ✅ Session Passed
        );

        // ✅ SAFE LOGIC: Use loginCount to detect first-time login
        if (deviceMapping.loginCount === 1) {
            logWithTime(`🆕 First-time login recorded for user (${user.userId}) on this device.`);
        } else {
            logWithTime(`🔁 Token refreshed for user (${user.userId}) on existing device.`);
        }
        
        return deviceMapping;

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

        // ✅ Step 2: Update User Core Flags (Atomic Operation)
        
        await UserModel.updateOne(
            { _id: user._id },
            {
                $set: {
                    refreshToken: null,
                    jwtTokenIssuedAt: null,
                    isVerified: false,
                    'devices.info': []
                }
            },
            { session: session }
        );

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

const logoutUserCompletely = async (user, device, context = "general sign out all devices") => {
    
    // Safety: Device exist karta hai ya nahi check kar lo
    const deviceUUID = device.deviceUUID;

    // 1. Start Session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Core Logout Logic (Database Operations)
        const coreLoggedOut = await logoutUserCompletelyCore(user, { session });
        
        if (!coreLoggedOut) {
            throw new Error("Core logout operation failed");
        }

        // 4. ✅ COMMIT TRANSACTION
        await session.commitTransaction();
        session.endSession();

        logWithTime(`👋 User (${user.userId}) fully logged out from ALL devices via ${deviceUUID}.`);

        // 5. 🚀 FIRE LOGS (After Commit)
        // "Logout All" ek bada event hai, isliye await karna safe hai
        logAuthEvent(
            user, 
            device, // Pura object pass kar do, log util handle kar lega
            AUTH_LOG_EVENTS.LOGOUT_ALL_DEVICE, 
            `User ID ${user.userId} logged out completely during ${context}.`, 
            null
        );
        
        // 6. Send Notification
        const contactInfo = getUserContacts(user);
        sendNotification({
            contactInfo,
            emailTemplate: userTemplate.logoutAllDevices,
            smsTemplate: userSmsTemplate.logoutAllDevices,
            data: { name: user.firstName || "User" }
        });
        
        return true;

    } catch (error) {
        // Rollback
        await session.abortTransaction();
        session.endSession();

        logWithTime(`❌ Error in logoutUserCompletely for user (${user.userId})`);
        errorMessage(error);
        return false;
    }
};

const loginUserOnDevice = async (user, device, refreshToken, context = "standard login") => {
    // 1. Start Session
    const session = await mongoose.startSession();
    session.startTransaction();

    // Logs collect karne ke liye array
    const logsToFire = [];

    try {
        // 2. Device Sync (Get Data + Audit Payload)
        const { deviceDoc, auditLogPayload: deviceLog } = await syncDeviceData( device, { session });
        if (deviceLog) logsToFire.push({ user, device: deviceDoc, ...deviceLog });

        // 3. Core Login
        const coreLoggedIn = await loginTheUserCore(user, deviceDoc._id, refreshToken, { session });
        if (!coreLoggedIn) throw new Error("Core login failed");

        // 4. Mapping Sync (Get Data + Audit Payload)
        const { mappingDoc, auditLogPayload: mappingLog } = await syncUserDeviceMapping(user, deviceDoc, { session });
        if (mappingLog) logsToFire.push({ user, device: deviceDoc, ...mappingLog });

        // 5. ✅ COMMIT TRANSACTION (Data Safe Now)
        await session.commitTransaction();
        session.endSession(); // Close session immediately
        
        logWithTime(`✅ Transaction committed successfully for user ${user.userId}`);

        // 6. 🚀 FIRE LOGS (After Commit - Safe Zone)
        // Ab DB rollback ka dar nahi, aur logs async chalenge
        
        // A. Pending Audit Logs (Device/Mapping changes)
        for (const log of logsToFire) {
            // Await lagana hai lagao, nahi to background me chhod do (User requirement ke hisab se)
            // Main recommend karunga 'await' taaki sequence maintain rahe
            logAuthEvent(log.user, log.device, log.event, log.message, log.metadata);
        }

        // B. Final Login Success Log
        logAuthEvent(user, deviceDoc, AUTH_LOG_EVENTS.LOGIN, `Login via ${context}`, null);

        return true;

    } catch (error) {
        // Rollback
        await session.abortTransaction();
        session.endSession();
        
        logWithTime(`❌ Transaction aborted: ${error.message}`);
        errorMessage(error);
        
        // Optional: Fail hone ka log alag se record kar sakte ho (without transaction)
        return false;
    }
};

module.exports = {
    logoutUserCompletely,
    loginUserOnDevice
};