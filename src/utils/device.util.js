const { deviceThreshold, usersPerDevice } = require("@configs/security.config");
const { logWithTime } = require("./time-stamps.util");
const { errorMessage,throwInternalServerError } = require("./error-handler.util");
const { UserModel } = require("@models/user.model");
const { FORBIDDEN } = require("@configs/http-status.config");

// 📦 Utility to get a device from user's devices.info array by deviceUUID
const getDeviceById = async (user, deviceUUID) => {
    // 🛠 Re-fetch fresh user from DB to ensure up-to-date device list
    user = await UserModel.findOne({ userId: user.userId });
    // 🔍 Check if devices.info array exists and is not empty
    if (!user?.devices?.info?.length) return null;
    // 🔎 Find device by deviceUUID inside devices.info
    return user.devices.info.find(d => d.deviceUUID === deviceUUID) || null;
};

const checkUserDeviceLimit = (req,res) => {
    const user = req.user || req.foundUser;
    const thresholdLimit = (user.userType === "ADMIN")?deviceThreshold.ADMIN:deviceThreshold.CUSTOMERS;
    if (user.devices.info.length >= thresholdLimit) {
        logWithTime(`Login Request Denied as User (${user.userId}) has crossed threshold limit of device sessions. Request is made from deviceUUID: (${req.deviceUUID})`);
        res.status(FORBIDDEN).json({ 
            success: false,
            message: "❌ Device threshold exceeded. Please logout from another device." 
        });
        return true;
    }
    return false;
}

const checkDeviceThreshold = async (deviceUUID, res) => {
    try {
        const thresholdLimit = usersPerDevice; // 📌 e.g., 5 users per device

        const usersUsingDevice = await UserModel.find({
            "devices.info.deviceUUID": deviceUUID
        }).select("userId"); // Select minimal fields for performance

        if (usersUsingDevice.length >= thresholdLimit) {
            logWithTime(`🛑 Device Threshold Exceeded: Device (${deviceUUID}) is already linked with ${usersUsingDevice.length} users.`);
            res.status(FORBIDDEN).json({
                success: false,
                message: "❌ Device limit reached. Too many users already signed in on this device."
            });
            return true;
        }
        return false;
    } catch (error) {
        logWithTime(`❌ Internal Error during Device Threshold Check for (${deviceUUID}):`, error);
        throwInternalServerError(res);
        return true;
    }
};

const createDeviceField = (req,res) => {
    try{
        const device = {
            deviceUUID: req.deviceUUID,
            addedAt: Date.now(),
            lastUsedAt: Date.now()
        };
        if(req.deviceName)device.deviceName = req.deviceName;
        if(req.deviceType)device.deviceType = req.deviceType;
        return device;
    }catch(err){
        logWithTime(`🛑 An Error Occured in making the Device Field during SignUp/SignIn for user having userId: (${req.body.userId})`)
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
}

module.exports = {
    getDeviceById,
    checkDeviceThreshold,
    createDeviceField,
    checkUserDeviceLimit
}