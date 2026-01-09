const { adminIDPrefix } = require("./id-prefixes.config");
const { IP_Address_Code } = require("./ip-address.config");

const adminUserID = Number(process.env.ADMIN_USER_ID);
const adminID = `${adminIDPrefix}${IP_Address_Code}${adminUserID}`;

module.exports = {
    adminUserID,
    adminID,
    IP_Address_Code
};