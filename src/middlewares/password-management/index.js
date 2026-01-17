const { validationMiddlewares } = require("./field-validation.middleware");
const { presenceMiddlewares } = require("./validate-request-body.middleware");

const passwordManagementMiddlewares = {
    ...validationMiddlewares,
    ...presenceMiddlewares
};

module.exports = {
    passwordManagementMiddlewares
};
