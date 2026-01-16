const { createAuthValidator } = require("../factory/auth-mode-middleware.factory");
const { RequestLocation } = require("@configs/enums.config");

const authValidatorBody = createAuthValidator(RequestLocation.BODY);
const authValidatorQuery = createAuthValidator(RequestLocation.QUERY);
const authValidatorParams = createAuthValidator(RequestLocation.PARAMS);

module.exports = {
    authValidatorBody,
    authValidatorQuery,
    authValidatorParams
};