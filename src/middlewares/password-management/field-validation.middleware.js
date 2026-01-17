const { validateBody, validateParams, validateQuery } = require("../factory/field-validation.middleware-factory");
const { validationSets } = require("@configs/validation-sets.config.js");

const resetPasswordFieldValidationMiddleware = validateBody(validationSets.resetPassword);

const validationMiddlewares = {
    resetPasswordFieldValidationMiddleware
}

module.exports = {
    validationMiddlewares
}