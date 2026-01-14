const { signIn } = require("./sign-in.controller");
const { signOut } = require("./sign-out-device.controller");
const { signOutAllDevices } = require("./sign-out-all-device.controller");
const { getMyAccount } = require("./view-account.controller");
const { getMyActiveSessions } = require("./view-my-active-devices.controller");
const { signUp } = require("./sign-up.controller");
const { getMyAuthLogs } = require("./view-auth-logs.controller");

const authController = {
    signUp,
    signIn,
    signOutAllDevices,
    signOut,
    getMyAccount,
    getMyActiveSessions,
    getMyAuthLogs
}

module.exports = { 
    authController 
};