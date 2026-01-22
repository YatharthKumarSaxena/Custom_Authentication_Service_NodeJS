const { checkBodyPresence } = require("../factory/validate-request-body.middleware-factory");
const {
    signUpField,
    signInField
} = require("@configs/required-fields.config.js");

const signupFieldPresenceMiddleware = checkBodyPresence("signUpFieldPresence",signUpField);
const signinFieldPresenceMiddleware = checkBodyPresence("signInFieldPresence",signInField);


const presenceMiddlewares = {
    signupFieldPresenceMiddleware,
    signinFieldPresenceMiddleware
}

module.exports = {
    presenceMiddlewares
}
