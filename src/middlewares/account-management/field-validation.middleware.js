const { validateBody, validateParams, validateQuery } = require("../factory/field-validation.middleware-factory");
const { validationSets } = require("@configs/validation-sets.config.js");

const activateAccountFieldValidationMiddleware = validateBody(validationSets.activateAccount);
const deactivateAccountFieldValidationMiddleware = validateBody(validationSets.deactivateAccount);
const handle2FAFieldValidationMiddleware = validateBody(validationSets.handle2FA);
const changePasswordFieldValidationMiddleware = validateBody(validationSets.changePassword);

const validationMiddlewares = {
    activateAccountFieldValidationMiddleware,
    deactivateAccountFieldValidationMiddleware,
    handle2FAFieldValidationMiddleware,
    changePasswordFieldValidationMiddleware
}

module.exports = {
    validationMiddlewares
}