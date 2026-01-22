const { validationRules } = require("./validation.config");

const validationSets = {
  signUp: {
    'password': validationRules.password
  },
  changePassword: {
    'newPassword': validationRules.password,
    'confirmPassword': validationRules.password
  },
  resetPassword: {
    'newPassword': validationRules.password,
    'confirmPassword': validationRules.password
  },
  verifyPhone: {
    'phone': validationRules.phone
  },
  verifyEmail: {
    'email': validationRules.email
  }
};

module.exports = {
  validationSets
};