const { 
    AUTH_BASE, 
    ACCOUNT_BASE, 
    VERIFICATION_BASE, 
    PASSWORD_BASE
} = require("../configs/uri.config");

const { authRouter } = require("./auth.routes");
const { accountManagementRouter } = require("./account-management.routes");
const { accountVerificationRouter } = require("./account-verification.routes");
const { passwordManagementRouter } = require("./password-management.routes");

module.exports = (app) => {
    app.use(AUTH_BASE, authRouter);
    app.use(ACCOUNT_BASE, accountManagementRouter);
    app.use(VERIFICATION_BASE, accountVerificationRouter);
    app.use(PASSWORD_BASE, passwordManagementRouter);
};
