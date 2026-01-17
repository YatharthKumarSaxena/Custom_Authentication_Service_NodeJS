const signUpField = ["password"];
const signInField = ["password"];
const activateAccount = ["password"];
const deactivateAccount = ["password"];
const handle2FA = ["password"];
const changePassword = ["password", "newPassword", "confirmPassword"];
const resetPassword = ["newPassword", "confirmPassword"];

module.exports = {
    signUpField,
    signInField,
    activateAccount,
    deactivateAccount,
    handle2FA,
    changePassword,
    resetPassword
};