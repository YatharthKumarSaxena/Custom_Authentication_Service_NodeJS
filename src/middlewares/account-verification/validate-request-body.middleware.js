const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("../factory/validate-request-body.middleware-factory");
const {

} = require("@configs/required-fields.config.js");

const presenceMiddlewares = {

}

module.exports = {
    presenceMiddlewares
}
