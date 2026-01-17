const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("../factory/validate-request-body.middleware-factory");
const {
    resetPassword
} = require("@configs/required-fields.config.js");

const resetPasswordFieldPresenceMiddleware = checkBodyPresence(resetPassword);

const presenceMiddlewares = {
    resetPasswordFieldPresenceMiddleware
}

module.exports = {
    presenceMiddlewares
}
