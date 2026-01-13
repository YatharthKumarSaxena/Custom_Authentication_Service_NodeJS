const { isValidRegex, validateLength } = require("@utils/validators-factory.util");
const { throwInternalServerError, logMiddlewareError, throwValidationError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { RequestLocation } = require("@/configs/enums.config");

/**
 * @param {string} controllerName - Logging ke liye
 * @param {Object} validationSet - Rules ka object
 * @param {string} requestLocation - 'body', 'query', ya 'params' (Default: 'body')
 */
const fieldValidationMiddleware = (controllerName, validationSet, requestLocation = RequestLocation.BODY) => {
  return (req, res, next) => {
    try {
      const fieldsToValidate = validationSet;
      const data = req[requestLocation]; // Dynamic access: req.body, req.query, etc.

      if (!fieldsToValidate) {
        logMiddlewareError(controllerName, "No validation set provided", req);
        return throwInternalServerError(res, new Error("Validation set is required"));
      }

      const errors = [];

      Object.entries(fieldsToValidate).forEach(([field, rules]) => {
        const value = data[field];

        // Agar value missing hai aur rule required nahi hai, to skip (Optional fields)
        if (value === undefined || value === null) return;

        // ✅ Enum validation
        if (rules.enum) {
          const isValid = rules.enum.reverseLookup(value);
          if (!isValid) {
            const validValues = rules.enum.getValidValues().join(", ");
            errors.push({
              field,
              message: `${field} must be one of: ${validValues}`,
              received: value
            });
          }
          return; 
        }

        // ✅ Regex validation
        if (rules.regex && !isValidRegex(rules.regex, value)) {
          errors.push({ field, message: `${field} format is invalid`, received: value });
        }

        // ✅ Length validation
        if (rules.length) {
          const isValid = validateLength(value, rules.length.min, rules.length.max);
          if (!isValid) {
            const msg = rules.length.min === rules.length.max
              ? `Length must be exactly ${rules.length.min} characters.`
              : `Length must be between ${rules.length.min} and ${rules.length.max} characters.`;
            errors.push({ field, message: msg, received: value });
          }
        }
      });

      if (errors.length > 0) {
        logMiddlewareError(controllerName, `Field validation failed in ${requestLocation}`, req);
        return throwValidationError(res, errors);
      }

      logWithTime(`✅ [${controllerName}Middleware] ${requestLocation} validated successfully`);
      return next();

    } catch (error) {
      logMiddlewareError(controllerName, "Field validation middleware error", req);
      return throwInternalServerError(res, error);
    }
  };
};

module.exports = { fieldValidationMiddleware };