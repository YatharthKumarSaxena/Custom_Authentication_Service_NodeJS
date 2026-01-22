const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("../factory/validate-request-body.middleware-factory");
const {
    verifyEmail,
    verifyPhone
} = require("@configs/required-fields.config.js");

const verifyEmailFieldPresenceMiddleware = checkBodyPresence("verifyEmailFieldPresence",verifyEmail);
const verifyPhoneFieldPresenceMiddleware = checkBodyPresence("verifyPhoneFieldPresence",verifyPhone);

const presenceMiddlewares = {
    verifyEmailFieldPresenceMiddleware,
    verifyPhoneFieldPresenceMiddleware
}

module.exports = {
    presenceMiddlewares
}
