const { forgotPassword } = require("./forgot-password.controller");
const { resetPassword } = require("./reset-password.controller");
const { verifyResetPassword } = require("./verify-reset-password.controller");

const passwordManagementController = {
    forgotPassword,
    verifyResetPassword,
    resetPassword
};

module.exports = {
    passwordManagementController 
};