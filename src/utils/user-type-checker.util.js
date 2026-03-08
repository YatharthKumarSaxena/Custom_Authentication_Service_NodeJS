/**
 * User Type Checker Utility
 * Pure functions to check user types
 * Returns boolean only - NO response handling
 * Uses factory pattern to reduce redundancy
 */

const { UserTypes } = require("@configs/enums.config");

/**
 * Factory function to create user type checker
 * @param {string} targetType - The UserType to check against
 * @returns {Function} Function that checks if user has that type
 */
const createUserTypeChecker = (targetType) => {
    return (user) => user && user.userType === targetType;
};

/**
 * Check if user is Admin
 * @param {Object} user - User object with userType field
 * @returns {boolean} True if user is admin
 */
const isAdmin = createUserTypeChecker(UserTypes.ADMIN);

/**
 * Check if user is Client
 * @param {Object} user - User object with userType field
 * @returns {boolean} True if user is client
 */
const isClient = createUserTypeChecker(UserTypes.CLIENT);

/**
 * Check if user is User (regular user)
 * @param {Object} user - User object with userType field
 * @returns {boolean} True if user is regular user
 */
const isUser = createUserTypeChecker(UserTypes.USER);

/**
 * Check if user has specific user type
 * @param {Object} user - User object with userType field
 * @param {string} userType - UserType to check (from UserTypes enum)
 * @returns {boolean} True if user matches the type
 */
const hasUserType = (user, userType) => {
    return user && user.userType === userType;
};

/**
 * Check if user has any of the specified user types
 * @param {Object} user - User object with userType field
 * @param {string[]} userTypes - Array of UserTypes to check
 * @returns {boolean} True if user matches any of the types
 * 
 * @example
 * hasAnyUserType(user, [UserTypes.USER, UserTypes.CLIENT]) // true if user is USER or CLIENT
 */
const hasAnyUserType = (user, userTypes) => {
    if (!user || !Array.isArray(userTypes) || userTypes.length === 0) {
        return false;
    }
    
    for (let i = 0; i < userTypes.length; i++) {
        if (user.userType === userTypes[i]) {
            return true;
        }
    }
    
    return false;
};

/**
 * Check if user does NOT have any of the specified user types
 * @param {Object} user - User object with userType field
 * @param {string[]} userTypes - Array of UserTypes to check against
 * @returns {boolean} True if user does NOT match any of the types
 * 
 * @example
 * isNotAnyUserType(user, [UserTypes.ADMIN, UserTypes.CLIENT]) // true if user is USER only
 */
const isNotAnyUserType = (user, userTypes) => {
    return !hasAnyUserType(user, userTypes);
};

module.exports = {
    isAdmin,
    isClient,
    isUser,
    hasUserType,
    hasAnyUserType,
    isNotAnyUserType,
    createUserTypeChecker  // Export factory for custom checkers
};
