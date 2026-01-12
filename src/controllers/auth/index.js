const { signIn } = require("./sign-in.controller");
const { signOut } = require("./sign-out-device.controller");
const { signOutAllDevices } = require("./sign-out-all-device.controller");
const { getMyAccount } = require("./view-account.controller");
const { getMyActiveDevices } = require("./view-my-active-devices.controller");
const { signUp } = require("./sign-up.controller");
const { viewMyAuthLogs } = require("./view-auth-logs.controller");

const authController = {
    signUp,
    signIn,
    signOutAllDevices,
    signOut,
    getMyAccount,
    getMyActiveDevices,
    viewMyAuthLogs
}

module.exports = { 
    authController 
};