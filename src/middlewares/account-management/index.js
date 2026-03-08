const { validationMiddlewares } = require("./field-validation.middleware");
const { presenceMiddlewares } = require("./validate-request-body.middleware");
const { checkSoftDeleteAllowed, checkHardDeleteAllowed } = require("./check-deletion-policy.middleware");
const { check2FAEnabled } = require("./check-2fa-enabled.middleware");

const accountManagementMiddlewares = {
    ...validationMiddlewares,
    ...presenceMiddlewares,
    checkSoftDeleteAllowed,
    checkHardDeleteAllowed,
    check2FAEnabled
};

module.exports = {
    accountManagementMiddlewares
};
