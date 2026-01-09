/**
 * ✅ Pure Validation Function (Industry Standard)
 * Returns validation result object, NO response handling
 * Middleware handles logging and HTTP responses
 * 
 * @param {Object} body - Request body object
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} { valid: boolean, missingFields: Array<string>, trimmedBody: Object }
 */
const validateRequestBody = (body, requiredFields) => {
    // Step 1: Validate body existence
    if (!body || Object.keys(body).length === 0) {
        return {
            valid: false,
            missingFields: ['Request body'],
            trimmedBody: {}
        };
    }

    // Step 2: Check missing or empty fields (after trimming)
    const missingFields = requiredFields.filter(field => {
        const value = body[field];
        
        // Field doesn't exist or is null/undefined
        if (value === null || value === undefined) {
            return true;
        }
        
        // If it's a string, trim and check if empty
        if (typeof value === 'string') {
            return value.trim().length === 0;
        }
        
        // For non-string values (numbers, booleans, etc.), consider them valid if they exist
        return false;
    });

    // Step 3: Trim all string fields in body
    const trimmedBody = { ...body };
    Object.keys(trimmedBody).forEach(key => {
        if (typeof trimmedBody[key] === 'string') {
            trimmedBody[key] = trimmedBody[key].trim();
        }
    });

    return {
        valid: missingFields.length === 0,
        missingFields,
        trimmedBody
    };
};

module.exports = { validateRequestBody };