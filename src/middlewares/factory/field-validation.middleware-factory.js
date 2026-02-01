const { isValidRegex, validateLength } = require("@utils/validators-factory.util");
const { throwInternalServerError, logMiddlewareError, throwValidationError } = require("@/responses/common/error-handler.response");
const { RequestLocation } = require("@configs/enums.config"); // Ensure Enums have 'body', 'query', 'params' values

/**
 * Core Logic (Internal Use mostly)
 */

const _genericValidation = (controllerName, validationSet, requestLocation) => {
  return (req, res, next) => {
    try {
      const fieldsToValidate = validationSet;
      
      // Safety check: Agar galti se requestLocation galat pass hua
      if (!req[requestLocation]) {
        logMiddlewareError(controllerName, `Invalid request location: ${requestLocation}`, req);
        return throwInternalServerError(res, new Error("Invalid validation location"));
      }

      const data = req[requestLocation]; 

      if (!fieldsToValidate) {
        logMiddlewareError(controllerName, "No validation set provided", req);
        return throwInternalServerError(res, new Error("Validation set is required"));
      }

      const errors = [];

      Object.entries(fieldsToValidate).forEach(([field, rules]) => {
        const value = data[field];

        // 1. Optional Field Handling
        // Agar value undefined/null hai, toh skip karo (unless required logic add karna ho)
        if (value === undefined || value === null) return;

        // 2. Enum Validation
        if (rules.enum) {
          // Assuming enum object has generic reverseLookup method
          const isValid = rules.enum.reverseLookup(value);
          if (!isValid) {
            const validValues = rules.enum.getValidValues().join(", ");
            errors.push({
              field,
              message: `${field} must be one of: ${validValues}`,
              received: value
            });
          }
          return; // Enum check fail hua ya pass, aage regex check ki zaroorat nahi hoti usually
        }

        // 3. Regex Validation
        if (rules.regex && !isValidRegex(value, rules.regex)) {
          errors.push({ 
            field, 
            message: `${field} format is invalid`, 
            received: value 
          });
        }

        // 4. Length Validation
        if (rules.length) {
          const isValid = validateLength(value, rules.length.min, rules.length.max);
          if (!isValid) {
            const msg = rules.length.min === rules.length.max
              ? `Length must be exactly ${rules.length.min} characters.`
              : `Length must be between ${rules.length.min} and ${rules.length.max} characters.`;
            errors.push({ 
              field, 
              message: msg, 
              received: value 
            });
          }
        }
      });

      if (errors.length > 0) {
        logMiddlewareError(controllerName, `Validation failed in ${requestLocation}`, req);
        return throwValidationError(res, errors);
      }

      // Success Log (Optional: Production mein disable kar sakte ho agar zyada logs ho rahe hain)
      // logWithTime(`✅ [${controllerName}] ${requestLocation} validated.`);
      
      return next();

    } catch (error) {
      logMiddlewareError(controllerName, `Middleware error in ${requestLocation}`, req);
      return throwInternalServerError(res, error);
    }
  };
};

/**
 * 1. Validate Body Wrapper
 */
const validateBody = (controllerName, validationSet) => {
    return _genericValidation(controllerName, validationSet, RequestLocation.BODY);
};

/**
 * 2. Validate Query Wrapper (URL Params like ?page=1&limit=10)
 */
const validateQuery = (controllerName, validationSet) => {
    return _genericValidation(controllerName, validationSet, RequestLocation.QUERY);
};

/**
 * 3. Validate Route Params Wrapper (URL Path like /users/:userId)
 */
const validateParams = (controllerName, validationSet) => {
    return _genericValidation(controllerName, validationSet, RequestLocation.PARAMS);
};

module.exports = { 
    validateBody, 
    validateQuery, 
    validateParams 
};