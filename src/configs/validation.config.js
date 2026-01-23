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

const {
    VerificationPurposeHelper
} = require("@utils/enum-validators.util");

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
    },
    verifyPurpose: {
        enum : VerificationPurposeHelper
    }
};

module.exports = {
    validationRules
};