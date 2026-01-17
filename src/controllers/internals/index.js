const { getUserAuthLogs } = require("./get-user-auth-logs.controller");
const { getUserDetailsAdmin } = require("./get-user-details.controller");
const { getUserSessionsForAdmin } = require("./get-user-device.controller");
const { blockDevice, unblockDevice } = require("./toggle-device-block-status.controller");
const { blockUser, unblockUser } = require("./toggle-user-block-status.controller")


const internalControllers = {
    getUserAuthLogs,
    getUserDetailsAdmin,
    getUserSessionsForAdmin,
    blockDevice,
    unblockDevice,
    blockUser,
    unblockUser
};

module.exports = {
    internalControllers
};