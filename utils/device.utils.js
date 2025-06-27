const { deviceThreshold, usersPerDevice } = require("../configs/user-id.config");
const { logWithTime } = require("../utils/time-stamps.utils");
const { errorMessage,throwInternalServerError } = require("../configs/error-handler.configs");
const UserModel = require("../models/user.model");
const { FORBIDDEN } = require("../configs/http-status.config");

// 📦 Utility to get a device from user's devices.info array by deviceID
const getDeviceByID = async (user, deviceID) => {
    // 🛠 Re-fetch fresh user from DB to ensure up-to-date device list
    user = await UserModel.findOne({ userID: user.userID });
    // 🔍 Check if devices.info array exists and is not empty
    if (!user?.devices?.info?.length) return null;
    // 🔎 Find device by deviceID inside devices.info
    return user.devices.info.find(d => d.deviceID === deviceID) || null;
};

const checkUserDeviceLimit = (req,res) => {
    const user = req.user || req.foundUser;
    const thresholdLimit = (user.userType === "ADMIN")?deviceThreshold.ADMIN:deviceThreshold.CUSTOMERS;
    if (user.devices.info.length >= thresholdLimit) {
        logWithTime(`Login Request Denied as User (${user.userID}) has crossed threshold limit of device sessions. Request is made from deviceID: (${req.deviceID})`);
        res.status(FORBIDDEN).json({ 
            success: false,
            message: "❌ Device threshold exceeded. Please logout from another device." 
        });
        return true;
    }
    return false;
}

const checkDeviceThreshold = async (deviceID, res) => {
    try {
        const thresholdLimit = usersPerDevice; // 📌 e.g., 5 users per device

        const usersUsingDevice = await UserModel.find({
            "devices.info.deviceID": deviceID
        }).select("userID"); // Select minimal fields for performance

        if (usersUsingDevice.length >= thresholdLimit) {
            logWithTime(`🛑 Device Threshold Exceeded: Device (${deviceID}) is already linked with ${usersUsingDevice.length} users.`);
            res.status(FORBIDDEN).json({
                success: false,
                message: "❌ Device limit reached. Too many users already signed in on this device."
            });
            return true;
        }
        return false;
    } catch (error) {
        logWithTime(`❌ Internal Error during Device Threshold Check for (${deviceID}):`, error);
        throwInternalServerError(res);
        return true;
    }
};

const createDeviceField = (req,res) => {
    try{
        const device = {
            deviceID: req.deviceID,
            addedAt: Date.now(),
            lastUsedAt: Date.now()
        };
        if(req.deviceName)device.deviceName = req.deviceName;
        if(req.deviceType)device.deviceType = req.deviceType;
        return device;
    }catch(err){
        logWithTime(`🛑 An Error Occured in making the Device Field during SignUp/SignIn for user having userID: (${req.body.userID})`)
        errorMessage(err);
        throwInternalServerError(res);
        return null;
    }
}

module.exports = {
    getDeviceByID: getDeviceByID,
    createDeviceField: createDeviceField,
    checkUserDeviceLimit: checkUserDeviceLimit,
    checkDeviceThreshold: checkDeviceThreshold
}