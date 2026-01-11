const crypto = require("crypto");
const { hashing } = require("@configs/security.config");
const { algorithm, encoding, saltLength } = hashing;

/**
 * Generate a random verification token for links
 * @param {number} length
 * @returns {string} token
 */

const generateLinkToken = (length = 32) => {
  return crypto.randomBytes(length).toString(encoding); // 64 chars hex by default
};

/**
 * Hash the token with a random salt
 */
const hashLinkToken = (token) => {
  const salt = crypto.randomBytes(saltLength).toString(encoding); // per-token salt
  const tokenHash = crypto.createHash(algorithm).update(token + salt).digest(encoding);
  return { tokenHash, salt };
};

/**
 * Verify token against hash & salt
 */
const verifyLinkToken = (inputToken, tokenHash, salt) => {
  const hashCheck = crypto.createHash(algorithm).update(inputToken + salt).digest(encoding);
  return hashCheck === tokenHash;
};

module.exports = {
  generateLinkToken,
  hashLinkToken,
  verifyLinkToken
};
