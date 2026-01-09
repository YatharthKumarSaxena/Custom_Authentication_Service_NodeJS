/**
 * ✅ Pure ID Validation Functions (Industry Standard)
 * These functions return boolean only, NO response handling
 * Middleware handles logging and HTTP responses
 */

const { isValidRegex, validateLength } = require("./validators-factory.util");
const { 
  UUID_V4_REGEX, 
  mongoIdRegex, 
  adminIdRegex 
} = require("@configs/regex.config");
const { deviceNameLength } = require("@configs/fields-length.config");

// UUID v4 validation
const isValidUUID = (value) => {
  return isValidRegex(value, UUID_V4_REGEX);
};

// MongoDB ObjectID validation
const isValidMongoID = (value) => {
  return isValidRegex(value, mongoIdRegex);
};

// Custom ID validation (e.g., ADM0000001)
const isValidAdminId = (value) => {
  return isValidRegex(value, adminIdRegex);
};

// Device name length validation
const isValidDeviceNameLength = (value) => {
  const { min, max } = deviceNameLength;
  return validateLength(value, min, max);
};

module.exports = {
  isValidUUID,
  isValidMongoID,
  isValidAdminId,
  isValidDeviceNameLength
};