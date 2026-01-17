const { validateBody } = require("../factory/field-validation.middleware-factory");
const { validationSets } = require("@configs/validation-sets.config.js");

const signupFieldValidationMiddleware = validateBody(validationSets.signUp);
const signinFieldValidationMiddleware = validateBody(validationSets.signIn);

const validationMiddlewares = {
    signupFieldValidationMiddleware,
    signinFieldValidationMiddleware
}

module.exports = {
    validationMiddlewares
}