/**
 * Generic Utility to check for missing fields and trim string values
 * @param {Object} data - req.body, req.query, or req.params
 * @param {Array} requiredFields - ["email", "password", "userId"]
 */
const validateMissingFields = (data, requiredFields) => {
    const missingFields = [];
    const cleanedData = { ...data }; // Original data ko mutate karne se bachne ke liye copy

    requiredFields.forEach((field) => {
        let value = cleanedData[field];

        // 1. Check if field is missing (undefined, null, or empty string)
        if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
            missingFields.push(field);
        } else {
            // 2. Agar string hai toh Trim kar do
            if (typeof value === "string") {
                cleanedData[field] = value.trim();
            }
        }
    });

    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields,
        cleanedData: cleanedData
    };
};

module.exports = { validateMissingFields };