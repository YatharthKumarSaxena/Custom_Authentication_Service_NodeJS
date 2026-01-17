const { adminIdPrefix } = require("./id-prefixes.config");
const { IP_Address_Code } = require("./ip-address.config");
const { userRegistrationCapacity } = require("./app-limits.config");

const adminID = `${adminIdPrefix}${IP_Address_Code}${userRegistrationCapacity}`;

module.exports = {
    adminID
};