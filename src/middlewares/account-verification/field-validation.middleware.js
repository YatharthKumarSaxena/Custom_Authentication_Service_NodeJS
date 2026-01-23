const { validateBody, validateParams, validateQuery } = require("../factory/field-validation.middleware-factory");
const { validationSets } = require("@configs/validation-sets.config.js");

const verifyEmailFieldValidationMiddleware = validateBody("verifyEmailFieldValidation",validationSets.verifyEmail);
const verifyPhoneFieldValidationMiddleware = validateBody("verifyPhoneFieldValidation",validationSets.verifyPhone);
const verifyPurposeFieldValidationMiddleware = validateBody("verifyPurposeFieldValidation",validationSets.resendVerification);

const validationMiddlewares = {
    verifyEmailFieldValidationMiddleware,
    verifyPhoneFieldValidationMiddleware,
    verifyPurposeFieldValidationMiddleware
}

module.exports = {
    validationMiddlewares
}