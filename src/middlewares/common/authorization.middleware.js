/**
 * Authorization Middlewares
 * Pre-configured authorization middlewares using authorizeUserTypes factory
 * 
 * These are reusable, pre-configured middlewares for common authorization scenarios
 * Based on migration guide patterns for account management routes
 */

const { authorizeUserTypes } = require("@middlewares/factory/index").factoryMiddlewares;
const { UserTypes } = require("@configs/enums.config");

/**
 * Restrict Admin from accessing route
 * Allows USER and CLIENT only
 * Use case: Deactivate, Delete, 2FA toggle operations
 */
const restrictAdmin = authorizeUserTypes(
    [UserTypes.USER, UserTypes.CLIENT],
    "This operation is not allowed for admin accounts. Admin accounts are protected."
);

/**
 * Restrict Admin and Client from accessing route
 * Allows USER only
 * Use case: Free user-only features
 */
const allowOnlyRegularUsers = authorizeUserTypes(
    [UserTypes.USER],
    "This operation is only allowed for regular user accounts."
);

/**
 * Allow Admin and Client only
 * Restricts USER
 * Use case: Premium features, advanced access
 */
const allowPremiumAccounts = authorizeUserTypes(
    [UserTypes.ADMIN, UserTypes.CLIENT],
    "This feature is only available for admin and client accounts."
);

/**
 * Allow Admin only
 * Use case: Admin panel, user management
 */
const allowAdminOnly = authorizeUserTypes(
    [UserTypes.ADMIN],
    "This operation is only allowed for admin accounts."
);

/**
 * Allow Client only
 * Use case: API management, integration features
 */
const allowClientOnly = authorizeUserTypes(
    [UserTypes.CLIENT],
    "This operation is only allowed for client accounts."
);

/**
 * Allow User and Client (block Admin)
 * Use case: User-facing features that admins shouldn't access
 */
const allowUsersAndClients = authorizeUserTypes(
    [UserTypes.USER, UserTypes.CLIENT],
    "This operation is not available for admin accounts."
);

module.exports = {
    restrictAdmin,
    allowOnlyRegularUsers,
    allowPremiumAccounts,
    allowAdminOnly,
    allowClientOnly,
    allowUsersAndClients
};
