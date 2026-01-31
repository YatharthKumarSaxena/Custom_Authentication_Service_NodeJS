/**
 * CENTRALIZED FIELD DEFINITIONS CONFIG
 * 
 * Single Source of Truth for:
 * - Required fields per endpoint/action
 * - Validation rules mapping
 * - Field-level metadata
 * 
 * Benefits:
 * 1. Ek jagah change karein, sab jagah reflect ho
 * 2. Type-safe through enum-like structure
 * 3. Automatic derivation of required-fields arrays
 * 4. Direct mapping to validation rules
 */

const { validationRules } = require("./validation.config");

/**
 * Field Metadata Structure:
 * {
 *   field: 'fieldName',           // Field identifier
 *   required: true/false,         // Is this field required?
 *   validation: validationRule,   // Link to validation.config.js rule
 *   description: 'Field purpose'  // Optional documentation
 * }
 */

// AUTH ENDPOINTS FIELD DEFINITIONS

const FieldDefinitions = {
  
  // Sign Up
  SIGN_UP: {
    PASSWORD: {
      field: 'password',
      required: true,
      validation: validationRules.password,
      description: 'User password for account creation'
    }
  },
  
  // Sign In
  SIGN_IN: {
    PASSWORD: {
      field: 'password',
      required: true,
      validation: validationRules.password,
      description: 'User password for authentication'
    }
  },
  
  // Activate Account
  ACTIVATE_ACCOUNT: {
    PASSWORD: {
      field: 'password',
      required: true,
      validation: validationRules.password,
      description: 'Password to activate suspended account'
    }
  },
  
  // Deactivate Account
  DEACTIVATE_ACCOUNT: {
    PASSWORD: {
      field: 'password',
      required: true,
      validation: validationRules.password,
      description: 'Password confirmation for deactivation'
    }
  },
  
  // Handle 2FA
  HANDLE_2FA: {
    PASSWORD: {
      field: 'password',
      required: true,
      validation: validationRules.password,
      description: 'Password for 2FA setup changes'
    }
  },
  
  // Change Password
  CHANGE_PASSWORD: {
    PASSWORD: {
      field: 'password',
      required: true,
      validation: validationRules.password,
      description: 'Current password for verification'
    },
    NEW_PASSWORD: {
      field: 'newPassword',
      required: true,
      validation: validationRules.password,
      description: 'New password to set'
    },
    CONFIRM_PASSWORD: {
      field: 'confirmPassword',
      required: true,
      validation: validationRules.password,
      description: 'Confirmation of new password'
    }
  },
  
  // Reset Password
  RESET_PASSWORD: {
    NEW_PASSWORD: {
      field: 'newPassword',
      required: true,
      validation: validationRules.password,
      description: 'New password for reset'
    },
    CONFIRM_PASSWORD: {
      field: 'confirmPassword',
      required: true,
      validation: validationRules.password,
      description: 'Confirmation of reset password'
    }
  },
  
  // Verify Email
  VERIFY_EMAIL: {
    EMAIL: {
      field: 'email',
      required: true,
      validation: validationRules.email,
      description: 'Email address to verify'
    }
  },
  
  // Verify Phone
  VERIFY_PHONE: {
    PHONE: {
      field: 'phone',
      required: true,
      validation: validationRules.phone,
      description: 'Phone number to verify'
    }
  },
  
  // Resend Verification
  RESEND_VERIFICATION: {
    PURPOSE: {
      field: 'purpose',
      required: true,
      validation: validationRules.verifyPurpose,
      description: 'Purpose of verification resend'
    }
  }
};

// HELPER: Get Required Fields Array

/**
 * Extracts required field names from a definition object
 * @param {Object} definition - Field definition object (e.g., FieldDefinitions.SIGN_UP)
 * @returns {Array<string>} - Array of required field names
 * 
 * Example:
 * getRequiredFields(FieldDefinitions.CHANGE_PASSWORD) 
 * => ['password', 'newPassword', 'confirmPassword']
 */

const getRequiredFields = (definition) => {
  return Object.values(definition)
    .filter(fieldMeta => fieldMeta.required)
    .map(fieldMeta => fieldMeta.field);
};

// HELPER: Get Validation Set

/**
 * Extracts validation rules mapped to field names
 * @param {Object} definition - Field definition object
 * @returns {Object} - Validation set { fieldName: validationRule }
 * 
 * Example:
 * getValidationSet(FieldDefinitions.VERIFY_PHONE)
 * => { phone: validationRules.phone }
 */

const getValidationSet = (definition) => {
  return Object.values(definition).reduce((acc, fieldMeta) => {
    if (fieldMeta.validation) {
      acc[fieldMeta.field] = fieldMeta.validation;
    }
    return acc;
  }, {});
};

// EXPORTS

module.exports = {
  FieldDefinitions,
  getRequiredFields,
  getValidationSet
};
