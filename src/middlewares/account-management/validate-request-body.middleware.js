const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("../factory/validate-request-body.middleware-factory");
const {
    activateAccount,
    deactivateAccount,
    handle2FA,
    changePassword
} = require("@configs/required-fields.config.js");

const activateAccountFieldPresenceMiddleware = checkBodyPresence(activateAccount);
const deactivateAccountFieldPresenceMiddleware = checkBodyPresence(deactivateAccount);
const handle2FAFieldPresenceMiddleware = checkBodyPresence(handle2FA);
const changePasswordFieldPresenceMiddleware = checkBodyPresence(changePassword);

const presenceMiddlewares = {
    activateAccountFieldPresenceMiddleware,
    deactivateAccountFieldPresenceMiddleware,
    handle2FAFieldPresenceMiddleware,
    changePasswordFieldPresenceMiddleware
}

module.exports = {
    presenceMiddlewares
}
