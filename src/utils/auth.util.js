const { UserModel } = require("@models/user.model");
const bcryptjs = require("bcryptjs");
const { isValidRegex, validateLength } = require("./validators-factory.util");
const { phoneNumberRegex, userIdRegex } = require("../configs/regex.config");
const { phoneNumberLength } = require("../configs/fields-length.config");
const { adminIdPrefix } = require("@/configs/id-prefixes.config");
const { SALT } = require("@/configs/security.config");

const checkPasswordIsValid = async (userId, providedPassword) => {
    const user = await UserModel
        .findOne({ userId })
        .select("+password");

    if (!user) return false;

    return await bcryptjs.compare(providedPassword, user.password);
};

const hashPassword = async (plainPassword) => {
    return await bcryptjs.hash(plainPassword, SALT);
};

const isAdminId = (userId) =>
    typeof userId === "string" &&
    isValidRegex(userId, userIdRegex) &&
    userId.startsWith(adminIdPrefix);

const createPhoneNumber = (countryCode, number) => {
    const newNumber = "+" + countryCode + number;
    if (!validateLength(newNumber, phoneNumberLength.min, phoneNumberLength.max)) {
        return null;
    }
    if (!isValidRegex(newNumber, phoneNumberRegex)) {
        return null;
    }
    return newNumber;
};

module.exports = {
    createPhoneNumber,
    checkPasswordIsValid,
    hashPassword,
    isAdminId
}