const { commonMiddlewares } = require("@middlewares/common/index");

const baseMiddlewares = [
    commonMiddlewares.verifyDeviceField,
    commonMiddlewares.isDeviceBlocked
];
const baseAuthMiddlewares = [
    ...baseMiddlewares,
    commonMiddlewares.verifyTokenMiddleware,
    commonMiddlewares.isUserAccountBlocked,
    commonMiddlewares.isUserAccountActive,
    commonMiddlewares.checkUserIsVerified
];

module.exports = { baseAuthMiddlewares, baseMiddlewares };