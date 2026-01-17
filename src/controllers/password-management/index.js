const { forgotPassword } = require("./forgot-password.controller");
const { resetPassword } = require("./reset-password.controller");

const passwordManagementController = {
    forgotPassword,
    resetPassword
};

module.exports = { 
    passwordManagementController 
};