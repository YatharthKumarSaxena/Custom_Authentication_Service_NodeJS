const { UserModel } = require("@models/user.model");
const { fetchEntity } = require("./fetch-entity.util");

/**
 * 🔍 Fetches a user from the database based on auth mode or userId
 * @param {string|null} email - User's email address
 * @param {string|null} fullPhoneNumber - User's full phone number
 * @param {string|null} userId - User's custom userId
 * @returns {Promise<Object|null>} - Returns the user object if found, null otherwise
 */
const fetchUser = async (email = null, fullPhoneNumber = null, userId = null) => {
  return await fetchEntity(
    UserModel,
    email,
    fullPhoneNumber,
    userId,
    "User",
    "userId"
  );
};

module.exports = {
  fetchUser
};