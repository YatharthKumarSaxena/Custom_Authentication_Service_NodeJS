const {
    strongPasswordRegex
} = require("./regex.config");

const {
    passwordLength

} = require("./fields-length.config");

const validationRules = {
    password: {
        regex: strongPasswordRegex,
        length: passwordLength
    }
};

module.exports = {
    validationRules
};