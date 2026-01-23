const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("../factory/validate-request-body.middleware-factory");
const {
    verifyEmail,
    verifyPhone,
    resendVerification
} = require("@configs/required-fields.config.js");

const verifyEmailFieldPresenceMiddleware = checkBodyPresence("verifyEmailFieldPresence",verifyEmail);
const verifyPhoneFieldPresenceMiddleware = checkBodyPresence("verifyPhoneFieldPresence",verifyPhone);
const verifyPurposeFieldPresenceMiddleware = checkBodyPresence("verifyPurposeFieldPresence",resendVerification);

const presenceMiddlewares = {
    verifyEmailFieldPresenceMiddleware,
    verifyPhoneFieldPresenceMiddleware,
    verifyPurposeFieldPresenceMiddleware
}

module.exports = {
    presenceMiddlewares
}
