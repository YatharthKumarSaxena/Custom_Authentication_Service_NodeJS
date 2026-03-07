/**
 * Object Shape Validator Utility
 * 
 * Validates that objects (especially JWT payloads) contain expected fields
 * and no unexpected fields. Enforces strict payload structure.
 * 
 * @author Custom Auth Service Team
 * @date 2026-03-06
 */

/**
 * Validate object shape against expected fields
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @param {string} label - Label for logging (e.g., "Access Token")
 * @returns {Object} { valid: boolean, missing: Array<string>, extra: Array<string> }
 */
const validateObjectShape = (obj, requiredFields, label = "Object") => {
    if (!obj || typeof obj !== 'object') {
        return {
            valid: false,
            missing: requiredFields,
            extra: [],
            label
        };
    }

    const objKeys = Object.keys(obj);
    const missing = [];
    const extra = [];

    // Check for missing required fields
    for (const field of requiredFields) {
        if (!(field in obj)) {
            missing.push(field);
        }
    }

    // Check for extra fields not in required list
    for (const key of objKeys) {
        if (!requiredFields.includes(key)) {
            extra.push(key);
        }
    }

    const valid = missing.length === 0 && extra.length === 0;

    return {
        valid,
        missing,
        extra,
        label
    };
};

/**
 * Validate that an object has at least the required fields (allows extra fields)
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @param {string} label - Label for logging
 * @returns {Object} { valid: boolean, missing: Array<string> }
 */
const validateRequiredFields = (obj, requiredFields, label = "Object") => {
    if (!obj || typeof obj !== 'object') {
        return {
            valid: false,
            missing: requiredFields,
            label
        };
    }

    const missing = [];

    for (const field of requiredFields) {
        if (!(field in obj)) {
            missing.push(field);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
        label
    };
};

module.exports = {
    validateObjectShape,
    validateRequiredFields
};
