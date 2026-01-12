const { fetchEntityFactory } = require("@middlewares/factory/fetch-entity.middleware-factory");
const { fetchUser } = require("@utils/fetch-user.util");

/**
 * 🔍 Fetch User Middleware
 * 
 * Strict validation: Validates identifiers based on AuthMode and fetches user from database
 * - Rejects if both email and phone are sent (except in BOTH mode)
 * - Rejects if extra identifiers are sent
 * - Validates according to DEFAULT_AUTH_MODE
 * - Attaches foundUser to req.foundUser
 * 
 * @example
 * router.post('/some-route', fetchUserMiddleware, controller)
 * // Controller mein: req.foundUser available hoga
 */
const fetchUserMiddleware = fetchEntityFactory(fetchUser, "User");

module.exports = { fetchUserMiddleware };