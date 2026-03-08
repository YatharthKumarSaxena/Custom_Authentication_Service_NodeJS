const { commonMiddlewares } = require("@middlewares/common/index");
const { authMiddlewares } = require("@middlewares/auth/index");
const { 
    adminPanelServiceMiddleware,
    softwareManagementServiceMiddleware 
} = require("@middlewares/internals/verify-service-name.middleware");

const baseMiddlewares = [
    commonMiddlewares.requestIdMiddleware,
    commonMiddlewares.verifyDeviceField,
    commonMiddlewares.isDeviceBlocked
];

const adminPanelInternalMiddlewares = [
    ...baseMiddlewares,
    adminPanelServiceMiddleware
];

const softwareManagementInternalMiddlewares = [
    ...baseMiddlewares,
    softwareManagementServiceMiddleware
];

const baseAuthMiddlewares = [
    ...baseMiddlewares,
    commonMiddlewares.verifyTokenMiddleware,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive,
    commonMiddlewares.checkUserIsVerified
];

const authRequestMiddlewares = [
    ...baseMiddlewares,
    authMiddlewares.sanitizeAuthBody,
    authMiddlewares.authValidatorBody
];

// ================= AUTH EXISTING USER =================

const authExistingUserMiddlewares = [
    ...authRequestMiddlewares,
    authMiddlewares.ensureUserExists
];

// ================= AUTH NEW USER =================

const authNewUserMiddlewares = [
    ...authRequestMiddlewares,
    authMiddlewares.ensureUserNew
];

module.exports = { baseAuthMiddlewares, baseMiddlewares, authRequestMiddlewares, authExistingUserMiddlewares, authNewUserMiddlewares, adminPanelInternalMiddlewares, softwareManagementInternalMiddlewares };