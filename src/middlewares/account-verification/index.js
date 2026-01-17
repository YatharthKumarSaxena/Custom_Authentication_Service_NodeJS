const { validateVerificationInput } = require("./verification.middleware");
const { validationMiddlewares } = require("./field-validation.middleware");
const { presenceMiddlewares } = require("./validate-request-body.middleware");

const accountVerificationMiddlewares = {
    validateVerificationInput,
    ...validationMiddlewares,
    ...presenceMiddlewares
};

module.exports = {
    accountVerificationMiddlewares
};
