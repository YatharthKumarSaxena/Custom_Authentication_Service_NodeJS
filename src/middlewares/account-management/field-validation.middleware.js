const { validateBody, validateParams, validateQuery } = require("../factory/field-validation.middleware-factory");
const { validationSets } = require("@configs/validation-sets.config.js");

const changePasswordFieldValidationMiddleware = validateBody("changePasswordFieldValidation",validationSets.changePassword);

const validationMiddlewares = {
    changePasswordFieldValidationMiddleware
}

module.exports = {
    validationMiddlewares
}