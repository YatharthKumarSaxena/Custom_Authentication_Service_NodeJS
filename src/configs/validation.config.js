const {
    phoneNumberRegex,
    localNumberRegex,
    emailRegex,
    UUID_V4_REGEX,
    userIdRegex
} = require("./regex.config");

const {
    emailLength,
    passwordLength,
    phoneNumberLength,
    deviceNameLength,
    countryCodeLength,
    localNumberLength,
    uuidLength,
    firstNameLength,
    otpLength
} = require("./fields-length.config");

const {

} = require("@utils/enum-validators.util");

const validationRules = {
};

module.exports = {
    validationRules
};