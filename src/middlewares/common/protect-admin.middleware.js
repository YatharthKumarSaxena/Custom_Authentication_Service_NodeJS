/**
 * Protect Admin Middleware
 * Prevents admin users from performing certain operations
 * Immediately throws Access Denied error if user is admin
 */

const { UserTypes } = require("@configs/enums.config");
const { throwAccessDeniedError, logMiddlewareError } = require("@/responses/common/error-handler.response");

/**
 * Middleware to block admin users from accessing specific routes
 * Useful for operations like account deletion, deactivation, etc.
 * 
 * @example
 * router.delete('/delete-account', [
 *     authMiddleware,
 *     protectAdmin,  // Blocks if user is admin
 *     deleteAccountController
 * ]);
 */
const protectAdmin = async (req, res, next) => {
    try {
        const user = req.user;

        // Check if user is admin
        if (user.userType === UserTypes.ADMIN) {
            logMiddlewareError(
                "protectAdmin",
                `Admin user ${user._id} attempted to access protected route: ${req.path}`,
                req
            );
            return throwAccessDeniedError(
                res,
                "This operation is not allowed for admin accounts. Admin accounts are protected and cannot perform this action."
            );
        }

        // User is not admin - allow access
        return next();

    } catch (error) {
        logMiddlewareError("protectAdmin", `Error in admin protection: ${error.message}`, req);
        return throwAccessDeniedError(res, "Unable to verify account permissions.");
    }
};

module.exports = {
    protectAdmin
};