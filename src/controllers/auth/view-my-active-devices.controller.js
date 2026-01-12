const { errorMessage, throwInternalServerError, getLogIdentifiers } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { logAuthEvent } =require("@utils/auth-log-util");
const { OK } = require("@configs/http-status.config");

const getMyActiveDevices = async (req, res) => {
  try {
    const user = req.user;

    if (!Array.isArray(user.devices?.info) || user.devices.info.length === 0) {
      logWithTime(`📭 No active devices found for User (${user.userID})`);
      return res.status(OK).json({
        success: true,
        message: "No active devices found.",
        total: 0,
        devices: []
      });
    }

    const publicDevices = user.devices.info.map(({ lastUsedAt, deviceType }) => ({
      lastUsedAt,
      deviceType: deviceType || "Unknown"
    })).sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt));

    // Update data into auth.logs
    logAuthEvent(req, "GET_MY_ACTIVE_DEVICES", null);

    logWithTime(`🙋‍♂️ User (${user.userID}) fetched public view of their active devices.`);
    return res.status(OK).json({
      success: true,
      message: "Your active sessions fetched successfully.",
      total: publicDevices.length,
      devices: publicDevices
    });
  } catch (err) {
    const getIdentifiers = getLogIdentifiers(req);
    logWithTime(`❌ An Internal Error Occurred while fetching the User Active Device Sessions ${getIdentifiers}`);
    errorMessage(err);
    return throwInternalServerError(res);
  }
};

module.exports = { 
    getMyActiveDevices 
};