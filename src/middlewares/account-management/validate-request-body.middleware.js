const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("../factory/validate-request-body.middleware-factory");
const {
    activateAccount,
    deactivateAccount,
    handle2FA,
    changePassword
} = require("@configs/required-fields.config.js");

const activateAccountFieldPresenceMiddleware = checkBodyPresence("activateAccountFieldPresence",activateAccount);
const deactivateAccountFieldPresenceMiddleware = checkBodyPresence("deactivateAccountFieldPresence",deactivateAccount);
const handle2FAFieldPresenceMiddleware = checkBodyPresence("handle2FAFieldPresence",handle2FA);
const changePasswordFieldPresenceMiddleware = checkBodyPresence("changePasswordFieldPresence",changePassword);

const presenceMiddlewares = {
    activateAccountFieldPresenceMiddleware,
    deactivateAccountFieldPresenceMiddleware,
    handle2FAFieldPresenceMiddleware,
    changePasswordFieldPresenceMiddleware
}

module.exports = {
    presenceMiddlewares
}
