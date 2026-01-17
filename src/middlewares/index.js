const { accountManagementMiddlewares } = require("./account-management/index");
const { authMiddlewares } = require("./auth/index");
const { accountVerificationMiddlewares } = require("./account-verification/index");
const { commonMiddlewares } = require("./common/index");
const { passwordManagementMiddlewares } = require("./password-management/index");
const { factoryMiddlewares } = require("./factory/index");
const { handlers } = require("./handlers/index");

const middlewares = {
    ...accountManagementMiddlewares,
    ...authMiddlewares,
    ...accountVerificationMiddlewares,
    ...commonMiddlewares,
    ...passwordManagementMiddlewares,
    ...factoryMiddlewares,
    ...handlers
}

module.exports = {
    middlewares
};
