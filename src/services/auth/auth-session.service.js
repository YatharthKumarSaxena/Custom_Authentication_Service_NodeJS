const { logoutUserCompletelyCore,loginTheUserCore } = require("@utils/auth-session.util");
const { clearRefreshTokenCookie, setRefreshTokenCookie } = require("./auth-cookie-service");
const { logWithTime } = require("@utils/time-stamps.util");
const { logAuthEvent } = require("@utils/auth-log-util");
const { AUTH_LOG_EVENTS } = require("@/configs/auth-log-events.config");
const { syncDeviceData, syncUserDeviceMapping } = require("./device.service");
const { errorMessage } = require("@utils/error-handler.util");
const { UserDeviceModel } = require("@models/user-device.model");
const { usersPerDevice, deviceThreshold } = require("@configs/security.config");
const mongoose = require("mongoose");
const { UserTypes } = require("@/configs/enums.config");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { sendNotification } = require("@utils/notification-dispatcher.util");
const { getUserContacts } = require("@utils/contact-selector.util");
const { userTemplate } = require("@services/templates/emailTemplate");
const { userSmsTemplate } = require("@services/templates/smsTemplate");

const logoutUserCompletely = async (req, res, context = "general sign out all devices") => {
    const user = req.user;
    
    // Safety: Device exist karta hai ya nahi check kar lo
    const device = req.device; 
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

        // 3. Clear Cookie (Response Operation)
        // Ye DB se related nahi hai, par agar upar fail hua to ye run nahi karega (jo sahi hai)
        const cookieCleared = clearRefreshTokenCookie(res);
        if (!cookieCleared) {
            logWithTime(`⚠️ Cookie clear failed during logout. User: ${user.userId}`);
            // Note: Cookie clear fail hone par hum transaction abort nahi karte usually, 
            // kyunki server side session kill karna zyada zaroori hai.
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

const loginUserOnDevice = async (req, res, refreshToken, context = "standard login") => {
    const user = req.user;
    const device = req.device;

    // 1. Start Session
    const session = await mongoose.startSession();
    session.startTransaction();

    // Logs collect karne ke liye array
    const logsToFire = [];

    try {
        // 2. Device Sync (Get Data + Audit Payload)
        const { deviceDoc, auditLogPayload: deviceLog } = await syncDeviceData( device, { session });
        if (deviceLog) logsToFire.push({ user, device: deviceDoc, ...deviceLog });

        // 🛑 SECURITY CHECK: DEVICE LIMITS 
         
        // A. Users Per Device Limit Check
        const validSessionSince = new Date(Date.now() - expiryTimeOfRefreshToken);

        // Step B: Check Users Per Device (Unique users on THIS device)
        const uniqueUsersOnDevice = await UserDeviceModel.distinct("userId", { 
            deviceId: deviceDoc._id,
            refreshToken: { $ne: null },
            jwtTokenIssuedAt: { $gte: validSessionSince } 
        }).session(session);

        if (uniqueUsersOnDevice.length >= usersPerDevice) {
            const isUserAlreadyOnDevice = uniqueUsersOnDevice.some(id => id.toString() === user._id.toString());
            
            if (!isUserAlreadyOnDevice) {
                throw new Error(`Device limit reached. Max ${usersPerDevice} accounts allowed per device.`);
            }
        }

        // B. Device Threshold Per User Check
        // "How many devices is this user active on?"
        const userRole = user.userType;
        let allowedSessionLimit = 0;
        if(userRole === UserTypes.ADMIN){
            allowedSessionLimit = deviceThreshold.ADMIN;
        }
        else{
            allowedSessionLimit = deviceThreshold.CUSTOMER;
        }

        const activeUserSessionsCount = await UserDeviceModel.countDocuments({
            userId: user._id,
            refreshToken: { $ne: null },
            jwtTokenIssuedAt: { $gte: validSessionSince },
            deviceId: { $ne: deviceDoc._id } 
        }).session(session);

        if (activeUserSessionsCount >= allowedSessionLimit) {
            throw new Error(`Session limit reached. You can only be active on ${allowedSessionLimit} devices.`);
        }

        // 3. Core Login
        const coreLoggedIn = await loginTheUserCore(user, deviceDoc._id, refreshToken, { session });
        if (!coreLoggedIn) throw new Error("Core login failed");

        // 4. Mapping Sync (Get Data + Audit Payload)
        const { mappingDoc, auditLogPayload: mappingLog } = await syncUserDeviceMapping(user, deviceDoc, { session });
        if (mappingLog) logsToFire.push({ user, device: deviceDoc, ...mappingLog });

        // 5. Cookie Set
        const cookieSet = setRefreshTokenCookie(res, refreshToken);
        if (!cookieSet) throw new Error("Cookie setting failed");

        // 6. ✅ COMMIT TRANSACTION (Data Safe Now)
        await session.commitTransaction();
        session.endSession(); // Close session immediately
        
        logWithTime(`✅ Transaction committed successfully for user ${user.userId}`);

        // 7. 🚀 FIRE LOGS (After Commit - Safe Zone)
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