const { changePassword } = require("./change-password.controller");
const { forgotPassword } = require("./forgot-password.controller");
const { resetPassword } = require("./reset-password.controller");

const passwordManagementController = {
    changePassword,
    forgotPassword,
    resetPassword
};

module.exports = { 
    passwordManagementController 
};