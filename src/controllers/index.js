const { accountManagementControllers } = require("./account-management/index");
const { passwordManagementController } = require("./password-management/index");
const { accountVerificationController } = require("./account-verification/index");
const { internalControllers } = require("./internals/index");
const { authController } = require("./auth/index");

const controllers = {
    ...accountManagementControllers,
    ...passwordManagementController,
    ...accountVerificationController,
    ...internalControllers,
    ...authController
};

module.exports = {
    controllers
};