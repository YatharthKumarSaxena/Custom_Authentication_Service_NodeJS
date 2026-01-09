const { isValidRegex, validateLength } = require("@utils/validators-factory.util");
const { throwInternalServerError, logMiddlewareError, throwValidationError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

/**
 * Factory Validation Middleware
 * Dynamically validates request body fields based on validation sets
 * Supports enum, regex, and length validations
 * 
 * @param {string} controllerName - Name of controller in validationSets
 * @returns {Function} Express middleware function
 */

const fieldValidationMiddleware = (controllerName, validationSet) => {
  return (req, res, next) => {
    try {
      const fieldsToValidate = validationSet;

      if(!fieldsToValidate){
        logMiddlewareError(controllerName, "No validation set provided to field validation middleware", req);
        return throwInternalServerError(res, new Error("Validation set is required"));
      }

      const errors = [];

      // Iterate over each field defined in validationSets
      Object.entries(fieldsToValidate).forEach(([field, rules]) => {
        const value = req.body[field];

        // ✅ Enum validation (highest priority)
        if (rules.enum) {
          const isValid = rules.enum.reverseLookup(value);
          if (!isValid) {
            const validValues = rules.enum.getValidValues().join(", ");
            errors.push({
              field: field,
              message: `${field} must be one of: ${validValues}`,
              received: value
            });
          }
          return; // Enum validation mein regex/length skip
        }

        // ✅ Regex validation
        if (rules.regex) {
          const isValid = isValidRegex(rules.regex, value);
          if (!isValid) {
            errors.push({
              field: field,
              message: `${field} format is invalid`,
              received: value
            });
          }
        }

        // ✅ Length validation
        if (rules.length) {
            const isValid = validateLength(value, rules.length.min, rules.length.max);
            if(!isValid){
              let msg;
              if(rules.length.min === rules.length.max){
                msg = `Invalid length for ${field}. Length must be exactly ${rules.length.min} characters.`;
              }
              else{
                msg = `Invalid length for ${field}. Length must be between ${rules.length.min} and ${rules.length.max} characters.`;
              }
              errors.push({
                field: field,
                message: msg,
                received: value
              });
            }
          }
      });

      // If validation errors exist, return 422
      if (errors.length > 0) {
        logMiddlewareError(controllerName, `Field validation failed: ${errors.map(e => e.field).join(', ')}`, req);
        return throwValidationError(res, errors);
      }

      logWithTime(`✅ [${controllerName}Middleware] All fields validated successfully`);
      return next();

    } catch (error) {
      logMiddlewareError(controllerName, "Field validation middleware error", req);
      return throwInternalServerError(res, error);
    }
  };
};

module.exports = {
  fieldValidationMiddleware
};