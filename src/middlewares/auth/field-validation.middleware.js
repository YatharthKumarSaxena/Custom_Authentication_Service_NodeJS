const { validateBody } = require("../factory/field-validation.middleware-factory");
const { validationSets } = require("@configs/validation-sets.config.js");

const signupFieldValidationMiddleware = validateBody("signUpFieldValidation", validationSets.signUp);

const validationMiddlewares = {
    signupFieldValidationMiddleware
}

module.exports = {
    validationMiddlewares
}