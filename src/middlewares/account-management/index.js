const { validationMiddlewares } = require("./field-validation.middleware");
const { presenceMiddlewares } = require("./validate-request-body.middleware");
const { check2FAEnabled } = require("./check-2fa-enabled.middleware");
const { checkSoftDeleteAllowed, checkHardDeleteAllowed, checkHybridDeleteEnabled } = require("./check-deletion-policy.middleware");

const accountManagementMiddlewares = {
    ...validationMiddlewares,
    ...presenceMiddlewares,
    check2FAEnabled,
    checkSoftDeleteAllowed,
    checkHardDeleteAllowed,
    checkHybridDeleteEnabled
};

module.exports = {
    accountManagementMiddlewares
};
