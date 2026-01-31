/**
 * Pure Validation Functions (Industry Standard)
 * These functions return boolean/data only, NO response handling
 * Middleware handles logging and HTTP responses
 */

// Checks if value exists in enum values
const isValidEnumValue = (enumObj, value) => {
  return Object.values(enumObj).includes(value);
};

// Checks if value exists in enum and returns boolean
const getEnumKeyByValue = (enumObj, value) => {
  return Object.keys(enumObj).some(key => enumObj[key] === value);
};

// Validates string length
const validateLength = (str, min, max) => {
  return str.length >= min && str.length <= max;
};

// Validates string against regex pattern
const isValidRegex = (str, regex) => {
  return regex.test(str);
};

/**
 * Smart Error Message Generator for Length Validation
 * Auto-generates "exactly X" vs "between X and Y" messages
 */
const generateLengthErrorMessage = (name, length, customMessage) => {
  if (customMessage) return customMessage;
  
  const { min, max } = length;
  if (min === max) {
    return `${name} must be exactly ${min} characters`;
  } else if (min && max) {
    return `${name} must be between ${min} and ${max} characters`;
  } else if (min) {
    return `${name} must be at least ${min} characters`;
  } else {
    return `${name} must not exceed ${max} characters`;
  }
};

module.exports = {
  // Pure validation functions
  isValidEnumValue,
  getEnumKeyByValue,
  validateLength,
  isValidRegex,
  generateLengthErrorMessage
};