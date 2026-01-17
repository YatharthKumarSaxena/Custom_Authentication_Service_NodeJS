const { commonMiddleware } = require("@middlewares/common/index");

const baseMiddlewares = [
    commonMiddleware.verifyDeviceField,
    commonMiddleware.isDeviceBlocked
];
const baseAuthMiddlewares = [
    ...baseMiddlewares,
    commonMiddleware.verifyTokenMiddleware,
    commonMiddleware.isUserAccountBlocked,
    commonMiddleware.isUserAccountActive
];

module.exports = { baseAuthMiddlewares, baseMiddlewares };