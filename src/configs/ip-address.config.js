const { getMyEnv } = require("@/utils/env.util");

module.exports = {
    IP_Address_Code: getMyEnv("IP_ADDRESS_CODE") // Unique per machine
}