const { logWithTime } = require("./time-stamps.util");

const errorMessage = (err) => {
    logWithTime("🛑 Error occurred:");
    logWithTime("File Name and Line Number where this error occurred is displayed below:- ");
    console.log(err.stack);
    logWithTime("Error Message is displayed below:- ");
    console.error(err.message);
}

const getLogIdentifiers = (req) => {
    const userId = req?.founduser?.userId || req?.user?.userId || "UNKNOWN_USER";
    const deviceUUID = req?.device?.deviceUUID || "UNKNOWN_DEVICE";
    return `with user ID: (${userId}). Request is made from device ID: (${deviceUUID})`;
};

const logMiddlewareError = (middlewareName, reason, req) => {
  const userId = req?.user?.userId || "UNKNOWN_USER";
  const deviceUUID = req?.device?.deviceUUID || "UNKNOWN_DEVICE";
  logWithTime(`❌ [${middlewareName}Middleware] Error: ${reason} | user: (${userId}) | device: (${deviceUUID})`);
};

module.exports = {
    logMiddlewareError,
    getLogIdentifiers,
    errorMessage
}