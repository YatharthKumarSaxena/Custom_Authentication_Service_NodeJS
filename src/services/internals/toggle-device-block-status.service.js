const { DeviceModel } = require("@models/device.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { UserTypes, AuthErrorTypes } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");
const ms = require("ms");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { WHITELISTED_DEVICE_UUIDS } = require("@configs/security.config");

const blockDeviceService = async (targetDeviceUUID, requestingAdminId) => {
    
    // 1. Find Device
    const device = await DeviceModel.findOne({ deviceUUID: targetDeviceUUID }).lean();
    if (!device) {
        throw { type: AuthErrorTypes.RESOURCE_NOT_FOUND, message: "Device not found." };
    }

    if (device.isBlocked) {
        return { success: false, message: "Device is already blocked." };
    }

    // ---------------------------------------------------------
    // 🛡️ SAFETY CHECK 1: Config Whitelist (Hardcoded VIPs)
    // ---------------------------------------------------------
    if (WHITELISTED_DEVICE_UUIDS.includes(targetDeviceUUID)) {
        throw { 
            type: AuthErrorTypes.FORBIDDEN, 
            message: "System Error: Cannot block a whitelisted (config) device." 
        };
    }

    // ❌ Removed: isTrusted DB Check (Kyunki ab ye field exist nahi karta)

    // ---------------------------------------------------------
    // 🛡️ SAFETY CHECK 2: Active Admin Session (Dynamic & Smart) 🔥
    // ---------------------------------------------------------
    const activeAdminSession = await UserDeviceModel.findOne({
        deviceId: device._id,
        refreshToken: { $ne: null }
    }).populate("userId", "userType").lean();

    if (activeAdminSession && activeAdminSession.userId.userType === UserTypes.ADMIN) {
        
        // Expiry Logic
        const expiryDurationMs = ms(expiryTimeOfRefreshToken);
        const issuedAt = new Date(activeAdminSession.jwtTokenIssuedAt).getTime();
        const now = Date.now();
        const isSessionAlive = now < (issuedAt + expiryDurationMs);

        if (isSessionAlive) {
            logWithTime(`⚠️ Block prevented: Admin is currently ACTIVE on device ${targetDeviceUUID}`);
            throw { 
                type: AuthErrorTypes.FORBIDDEN, 
                message: "Cannot block a device with a LIVE Admin session. Logout admin first." 
            };
        } else {
            logWithTime(`ℹ️ Found Admin session on ${targetDeviceUUID}, but it is EXPIRED. Proceeding to block.`);
        }
    }

    // ---------------------------------------------------------
    // ⚔️ EXECUTE BLOCK
    // ---------------------------------------------------------
    await DeviceModel.updateOne(
        { _id: device._id },
        { $set: { isBlocked: true } }
    );

    await UserDeviceModel.updateMany(
        { deviceId: device._id },
        { 
            $set: { 
                refreshToken: null,
                lastLogoutAt: new Date()
            } 
        }
    );

    logWithTime(`🚫 Device (${targetDeviceUUID}) blocked by Admin (${requestingAdminId}).`);

    return {
        success: true,
        message: "Device blocked and all sessions terminated."
    };
};

const { DeviceModel } = require("@models/device.model");
const { AuthErrorTypes } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Service to Unblock a Device
 * @param {String} targetDeviceUUID - UUID of device to unblock
 * @param {String} requestingAdminId - ID of admin performing action
 */
const unblockDeviceService = async (targetDeviceUUID, requestingAdminId) => {
    
    // 1. Find Device
    const device = await DeviceModel.findOne({ deviceUUID: targetDeviceUUID }).lean();
    
    if (!device) {
        throw { 
            type: AuthErrorTypes.RESOURCE_NOT_FOUND, 
            message: "Device not found." 
        };
    }

    // 2. Conflict Check: Agar device pehle se Unblocked hai
    if (!device.isBlocked) {
        return { 
            success: false, 
            message: "Device is already active (not blocked)." 
        };
    }

    // 3. Unblock Logic
    await DeviceModel.updateOne(
        { _id: device._id },
        { $set: { isBlocked: false } }
    );

    // 4. Logging
    logWithTime(`✅ Device (${targetDeviceUUID}) unblocked by Admin (${requestingAdminId}).`);

    return {
        success: true,
        message: "Device successfully unblocked."
    };
};

module.exports = { blockDeviceService, unblockDeviceService };