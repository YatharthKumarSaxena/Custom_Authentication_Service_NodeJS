const { validationMiddlewares } = require("./field-validation.middleware");
const { presenceMiddlewares } = require("./validate-request-body.middleware");

const accountManagementMiddlewares = {
    ...validationMiddlewares,
    ...presenceMiddlewares
};

module.exports = {
    accountManagementMiddlewares
};
