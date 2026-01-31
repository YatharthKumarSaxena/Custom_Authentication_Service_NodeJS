const { isDeviceBlocked } = require("./is-device-blocked.middleware");
const { isUserAccountActive } = require("./is-user-account-active.middleware");
const { isUserAccountBlocked } = require("./is-user-blocked.middleware");
const { verifyDeviceField } = require("./verify-device-field.middleware");
const { verifyTokenMiddleware } = require("./verify-token.middleware");
const { checkUserIsVerified } = require("./check-user-is-verified.middleware");
const { requestIdMiddleware } = require('./check-request-id.middleware');

const commonMiddlewares = {
    isDeviceBlocked,
    isUserAccountActive,
    isUserAccountBlocked,
    verifyDeviceField,
    verifyTokenMiddleware,
    checkUserIsVerified,
    requestIdMiddleware
}

module.exports = {
    commonMiddlewares
};