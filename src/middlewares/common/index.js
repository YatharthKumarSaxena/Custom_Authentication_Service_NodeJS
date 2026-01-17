const { isDeviceBlocked } = require("./is-device-blocked.middleware");
const { isUserAccountActive } = require("./is-user-account-active.middleware");
const { isUserAccountBlocked } = require("./is-user-blocked.middleware");
const { verifyDeviceField } = require("./verify-device-field.middleware");
const { verifyTokenMiddleware } = require("./verify-token.middleware");

const commonMiddlewares = {
    isDeviceBlocked,
    isUserAccountActive,
    isUserAccountBlocked,
    verifyDeviceField,
    verifyTokenMiddleware
}

module.exports = {
    commonMiddlewares
};