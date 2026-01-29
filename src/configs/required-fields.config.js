/**
 * ===============================================
 * 🔹 REQUIRED FIELDS CONFIG (Auto-Generated)
 * ===============================================
 * 
 * ⚠️ DO NOT MANUALLY EDIT THIS FILE!
 * 
 * These arrays are automatically derived from:
 * @see field-definitions.config.js (Single Source of Truth)
 * 
 * To add/remove/modify required fields:
 * → Edit FieldDefinitions in field-definitions.config.js
 * → Changes will automatically reflect here
 */

const { FieldDefinitions, getRequiredFields } = require("./field-definitions.config");

// ========================================
// 🔹 AUTO-GENERATED REQUIRED FIELDS
// ========================================

const signUpField = getRequiredFields(FieldDefinitions.SIGN_UP);
const signInField = getRequiredFields(FieldDefinitions.SIGN_IN);
const activateAccount = getRequiredFields(FieldDefinitions.ACTIVATE_ACCOUNT);
const deactivateAccount = getRequiredFields(FieldDefinitions.DEACTIVATE_ACCOUNT);
const handle2FA = getRequiredFields(FieldDefinitions.HANDLE_2FA);
const changePassword = getRequiredFields(FieldDefinitions.CHANGE_PASSWORD);
const resetPassword = getRequiredFields(FieldDefinitions.RESET_PASSWORD);
const verifyEmail = getRequiredFields(FieldDefinitions.VERIFY_EMAIL);
const verifyPhone = getRequiredFields(FieldDefinitions.VERIFY_PHONE);
const resendVerification = getRequiredFields(FieldDefinitions.RESEND_VERIFICATION);

module.exports = {
    signUpField,
    signInField,
    activateAccount,
    deactivateAccount,
    handle2FA,
    changePassword,
    resetPassword,
    verifyEmail,
    verifyPhone,
    resendVerification
};