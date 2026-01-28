const { authValidatorBody } = require("./auth.middleware");
const { validationMiddlewares } = require("./field-validation.middleware");
const { presenceMiddlewares } = require("./validate-request-body.middleware");
const { ensureUserExists, ensureUserNew } = require("./fetch-user.middleware");
const { firstNameValidator } = require("./first-name.middleware");
const { sanitizeAuthBody } = require("./sanitize-auth.middleware");

const authMiddlewares = {
    authValidatorBody,
    ...validationMiddlewares,
    ...presenceMiddlewares,
    ensureUserExists,
    ensureUserNew,
    firstNameValidator,
    sanitizeAuthBody
};

module.exports = {
    authMiddlewares
}