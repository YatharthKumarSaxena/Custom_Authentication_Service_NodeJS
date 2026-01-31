/**
 * VALIDATION SETS CONFIG (Auto-Generated)
 * 
 * DO NOT MANUALLY EDIT THIS FILE!
 * 
 * These validation sets are automatically derived from:
 * @see field-definitions.config.js (Single Source of Truth)
 * 
 * To add/remove/modify validation rules:
 * → Edit FieldDefinitions in field-definitions.config.js
 * → Changes will automatically reflect here
 */

const { FieldDefinitions, getValidationSet } = require("./field-definitions.config");

// AUTO-GENERATED VALIDATION SETS

const validationSets = {
  signUp: getValidationSet(FieldDefinitions.SIGN_UP),
  signIn: getValidationSet(FieldDefinitions.SIGN_IN),
  activateAccount: getValidationSet(FieldDefinitions.ACTIVATE_ACCOUNT),
  deactivateAccount: getValidationSet(FieldDefinitions.DEACTIVATE_ACCOUNT),
  handle2FA: getValidationSet(FieldDefinitions.HANDLE_2FA),
  changePassword: getValidationSet(FieldDefinitions.CHANGE_PASSWORD),
  resetPassword: getValidationSet(FieldDefinitions.RESET_PASSWORD),
  verifyPhone: getValidationSet(FieldDefinitions.VERIFY_PHONE),
  verifyEmail: getValidationSet(FieldDefinitions.VERIFY_EMAIL),
  resendVerification: getValidationSet(FieldDefinitions.RESEND_VERIFICATION)
};

module.exports = {
  validationSets
};