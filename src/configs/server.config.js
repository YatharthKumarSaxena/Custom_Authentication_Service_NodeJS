const { getMyEnvAsNumber } = require("@/utils/env.util");

/* Since Port Number can Change , hence it is a Configurable Value and placed in Configs Folder */
module.exports = {
    // Port Number provided by env files are always in String Format
    // Most libraries like Express.js expect the port as a number when passed to app.listen()
    PORT_NUMBER: getMyEnvAsNumber("PORT_NUMBER", 8080)
}