const { createAuthValidator } = require("./auth-mode-middleware.factory");
const { validateBody, validateParams, validateQuery } = require("./field-validation.middleware-factory");
const { checkBodyPresence, checkParamsPresence, checkQueryPresence } = require("./validate-request-body.middleware-factory");
const { fetchEntityFactory } = require("./fetch-entity.middleware-factory");

const factoryMiddlewares = {
    createAuthValidator,
    validateBody,
    validateParams,
    validateQuery,
    checkBodyPresence,
    checkParamsPresence,
    checkQueryPresence,
    fetchEntityFactory
};

module.exports = {
    factoryMiddlewares
};