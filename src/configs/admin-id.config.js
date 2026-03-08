const { customIdPrefix } = require("./id-prefixes.config");
const { IP_Address_Code } = require("./ip-address.config");
const { userRegistrationCapacity } = require("./app-limits.config");

const adminID = `${customIdPrefix}${IP_Address_Code}${userRegistrationCapacity}`;

module.exports = {
    adminID
};