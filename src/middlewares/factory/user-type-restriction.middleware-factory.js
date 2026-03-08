
const { hasAnyUserType } = require("@utils/user-type-checker.util");
const { throwAccessDeniedError, logMiddlewareError } = require("@/responses/common/error-handler.response");
const { logWithTime } = require("@/utils/time-stamps.util");

/**
 * Allow only specific user types to access route
 * Uses loop-based validation for efficiency
 * @param {string[]} userTypes - Array of user types to allow
 * @param {string} [customMessage] - Optional custom error message
 * @returns {Function} Express middleware function
 */
const authorizeUserTypes = (userTypes, customMessage) => {
    return (req, res, next) => {
        try {
            const user = req.user || req.foundUser;

            if (!user) {
                logMiddlewareError(
                    "authorizeUserTypes",
                    "User object not found in request",
                    req
                );
                return throwAccessDeniedError(res, "Authentication required.");
            }

            // Validate array input
            if (!Array.isArray(userTypes) || userTypes.length === 0) {
                logMiddlewareError(
                    "authorizeUserTypes",
                    "Invalid userTypes array provided",
                    req
                );
                return throwAccessDeniedError(res, "Access configuration error.");
            }

            // Check if user has any of the allowed types using utility
            if (!hasAnyUserType(user, userTypes)) {
                logMiddlewareError(
                    "authorizeUserTypes",
                    `User type ${user.userType} attempted to access restricted route: ${req.path}`,
                    req
                );
                
                const message = customMessage || 
                    `This operation is only allowed for specific account types.`;
                
                return throwAccessDeniedError(res, message);
            }

            // User type is allowed - proceed
            logWithTime(
                `✅ User type ${user.userType} allowed to access route: ${req.path}`
            );

            return next();

        } catch (error) {
            logMiddlewareError(
                "authorizeUserTypes",
                `Error in user types allowance check: ${error.message}`,
                req
            );
            return throwAccessDeniedError(res, "Unable to verify account permissions.");
        }
    };
};

module.exports = {
    authorizeUserTypes
};
