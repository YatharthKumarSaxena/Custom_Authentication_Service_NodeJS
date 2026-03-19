const { DeviceModel } = require("@models/device.model");
const { UserDeviceModel } = require("@models/user-device.model");
const { UserTypes, AuthErrorTypes } = require("@configs/enums.config");
const { logWithTime } = require("@utils/time-stamps.util");
const ms = require("ms");
const { expiryTimeOfRefreshToken } = require("@configs/token.config");
const { WHITELISTED_DEVICE_UUIDS } = require("@configs/security.config");
const { logSystemEvent } = require("@services/system/system-log.service");
const { SYSTEM_LOG_EVENTS, STATUS_TYPES, SERVICE_NAMES } = require("@configs/system-log-events.config");

const blockDeviceService = async (targetDeviceUUID, requestingAdminId, options = {}) => {

    // 1. Find Device
    const device = await DeviceModel.findOne({ deviceUUID: targetDeviceUUID }).lean();
    let sessionsTerminated = 0;
    if (!device) {
        // Create Device
        const newDevice = new DeviceModel({
            deviceUUID: targetDeviceUUID,
            deviceName: null,
            deviceType: null,
            isBlocked: true // Directly block since admin wants to block an unknown device
        });
        await newDevice.save();

        logWithTime(`🚫 Device (${targetDeviceUUID}) not found. Created and blocked as per admin request.`);

    } else {
        if (device.isBlocked) {
            return { success: false, message: "Device is already blocked." };
        }

        // SAFETY CHECK 1: Config Whitelist (Hardcoded VIPs)
        if (WHITELISTED_DEVICE_UUIDS.includes(targetDeviceUUID)) {
            throw {
                type: AuthErrorTypes.FORBIDDEN,
                message: "System Error: Cannot block a whitelisted (config) device."
            };
        }

        // Removed: isTrusted DB Check (Kyunki ab ye field exist nahi karta)

        // SAFETY CHECK 2: Active Admin Session (Dynamic & Smart)
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

        // EXECUTE BLOCK
        await DeviceModel.updateOne(
            { _id: device._id },
            { $set: { isBlocked: true } }
        );

        const updateResult = await UserDeviceModel.updateMany(
            { deviceId: device._id },
            {
                $set: {
                    refreshToken: null,
                    lastLogoutAt: new Date()
                }
            }
        );
        sessionsTerminated = updateResult.modifiedCount;

        logWithTime(`🚫 Device (${targetDeviceUUID}) blocked by Admin (${requestingAdminId}).`);
    }



    // SYSTEM LOG - Track admin action
    logSystemEvent({
        eventType: SYSTEM_LOG_EVENTS.DEVICE_BLOCKED,
        action: "DEVICE_BLOCK",
        description: `Device (${targetDeviceUUID}) blocked. ${sessionsTerminated} active sessions terminated.`,
        serviceName: SERVICE_NAMES.ADMIN_PANEL_SERVICE,
        status: STATUS_TYPES.SUCCESS,
        targetId: targetDeviceUUID,
        executedBy: requestingAdminId,
        sourceService: SERVICE_NAMES.AUTH_SERVICE,
        req: options.req,
        metadata: {
            targetDeviceUUID,
            sessionsTerminated
        }
    }).catch(err => {
        logWithTime(`⚠️ Failed to log system event for device block: ${err.message}`);
    });

    return {
        success: true,
        message: "Device blocked and all sessions terminated."
    };
};

/**
 * Service to Unblock a Device
 * @param {String} targetDeviceUUID - UUID of device to unblock
 * @param {String} requestingAdminId - ID of admin performing action
 * @param {Object} options - Additional context
 */
const unblockDeviceService = async (targetDeviceUUID, requestingAdminId, options = {}) => {

    // 1. Find Device
    const device = await DeviceModel.findOne({ deviceUUID: targetDeviceUUID }).lean();

    if (!device) {
        // Create Device as Unblocked (since admin wants to unblock an unknown device)
        const newDevice = new DeviceModel({
            deviceUUID: targetDeviceUUID,
            deviceName: null,
            deviceType: null,
            isBlocked: false
        });
        await newDevice.save();

        logWithTime(`ℹ️  Device (${targetDeviceUUID}) not found. Created and left unblocked as per admin request.`);
    } else {
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
    }

    // SYSTEM LOG - Track admin action
    logSystemEvent({
        eventType: SYSTEM_LOG_EVENTS.DEVICE_UNBLOCKED,
        action: "DEVICE_UNBLOCK",
        description: `Device (${targetDeviceUUID}) unblocked.`,
        serviceName: SERVICE_NAMES.ADMIN_PANEL_SERVICE,
        status: STATUS_TYPES.SUCCESS,
        targetId: targetDeviceUUID,
        executedBy: requestingAdminId,
        sourceService: SERVICE_NAMES.AUTH_SERVICE,
        req: options.req,
        metadata: {
            targetDeviceUUID
        }
    }).catch(err => {
        logWithTime(`⚠️ Failed to log system event for device unblock: ${err.message}`);
    });

    return {
        success: true,
        message: "Device successfully unblocked."
    };
};

module.exports = { blockDeviceService, unblockDeviceService };