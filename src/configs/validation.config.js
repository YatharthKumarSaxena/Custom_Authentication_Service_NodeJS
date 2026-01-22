const {
    strongPasswordRegex,
    phoneNumberRegex,
    emailRegex
} = require("./regex.config");

const {
    passwordLength,
    phoneNumberLength,
    emailLength
} = require("./fields-length.config");

const validationRules = {
    password: {
        regex: strongPasswordRegex,
        length: passwordLength
    },
    phone: {
        length: phoneNumberLength,
        regex: phoneNumberRegex
    },
    email: {
        length: emailLength,
        regex: emailRegex
    }
};

module.exports = {
    validationRules
};