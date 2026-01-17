const { validationRules } = require("./validation.config");

const validationSets = {
  signUp: {
    'password': validationRules.password
  },
  signIn: {
    'password': validationRules.password
  },
  activateAccount: {
    'password': validationRules.password
  },
  deactivateAccount: {
    'password': validationRules.password
  },
  handle2FA: {
    'password': validationRules.password
  },
  changePassword: {
    'password': validationRules.password,
    'newPassword': validationRules.password,
    'confirmPassword': validationRules.password
  },
  resetPassword: {
    'newPassword': validationRules.password,
    'confirmPassword': validationRules.password
  }
};

module.exports = {
  validationSets
};