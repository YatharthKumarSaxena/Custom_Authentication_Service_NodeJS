const { deviceThreshold } = require("../configs/user-id.config");
const { logWithTime } = require("../utils/time-stamps.utils");
const { errorMessage,throwInternalServerError } = require("../configs/error-handler.configs");

// 📦 Utility to get a device from user's devices array by deviceID
const getDeviceByID = (user, deviceID) => {
    if (!user?.devices?.length) return null;
    return user.devices.find(d => d.deviceID === deviceID) || null;
};

const checkThresholdExceeded = (req,res) => {
    const user = req.user;
    const thresholdLimit = (user.userType === "ADMIN")?deviceThreshold.ADMIN:deviceThreshold.CUSTOMERS;
    if (user.devices.length >= thresholdLimit) {
        logWithTime(`Login Request Denied as User (${user.userID}) has crossed threshold limit of device sessions. Request is made from deviceID: (${req.deviceID})`);
        res.status(403).json({ 
            success: false,
            message: "❌ Device threshold exceeded. Please logout from another device." 
        });
        return true;
    }
    return false;
}

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
    checkThresholdExceeded: checkThresholdExceeded
}