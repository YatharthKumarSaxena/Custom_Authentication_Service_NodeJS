const { UserModel } = require("@models/user.model");
const bcryptjs = require("bcryptjs");
const { isValidRegex, validateLength } = require("./field-validators.util");
const { phoneNumberRegex, userIdRegex } = require("../configs/regex.config");
const { phoneNumberLength } = require("../configs/fields-length.config");
const { adminIdPrefix } = require("@/configs/id-prefixes.config");


const checkPasswordIsValid = async (userId, providedPassword) => {
    const user = await UserModel
        .findOne({ userId })
        .select("+password");

    if (!user) return false;

    return await bcryptjs.compare(providedPassword, user.password);
};

const isAdminId = (userId) =>
    typeof userId === "string" &&
    isValidRegex(userId, userIdRegex) &&
    userId.startsWith(adminIdPrefix);

const createphone = (countryCode, number) => {
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
    createphone: createphone,
    checkPasswordIsValid: checkPasswordIsValid,
    isAdminId: isAdminId
}