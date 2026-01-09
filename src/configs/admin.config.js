const adminPrefixes = require("./id-prefixes.config").adminIDPrefix;
const IP_Address_Code = require("./ip-address.config").IP_Address_Code;
const adminUserID = Number(process.env.ADMIN_USER_ID);
const adminID = `${adminPrefixes}${IP_Address_Code}${adminUserID}`;

module.exports = {
  adminUserID,
  adminID,
  IP_Address_Code,
  adminUser: {
    name: process.env.ADMIN_NAME,
    phoneNumber: {
      countryCode: process.env.ADMIN_COUNTRY_CODE,
      number: process.env.ADMIN_NUMBER
    },
    fullPhoneNumber: process.env.ADMIN_FULL_PHONE_NUMBER,
    password: process.env.ADMIN_PASSWORD,
    emailID: process.env.ADMIN_EMAIL_ID,
    userType: "ADMIN",
    userID: adminID,
    devices: { info: [] }
  }
};
