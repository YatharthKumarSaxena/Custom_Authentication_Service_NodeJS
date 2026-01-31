const { fetchEntityFactory } = require("@middlewares/factory/fetch-entity.middleware-factory");
const { fetchUser } = require("@/services/common/fetch-user.util");

/**
 * CASE 1: LOGIN / GET DETAILS
 * Ye check karega ki User EXIST karta hai.
 * Agar nahi mila -> 404 Error throw karega.
 * Use: Login, Forgot Password, Get Profile
 */
const ensureUserExists = fetchEntityFactory(fetchUser, "User", true);

/**
 * CASE 2: REGISTRATION
 * Ye check karega ki User EXIST NAHI karta.
 * Agar mil gaya -> 409 Conflict Error throw karega.
 * Use: Sign Up, Create User
 */
const ensureUserNew = fetchEntityFactory(fetchUser, "User", false);

module.exports = { 
    ensureUserExists, 
    ensureUserNew 
};