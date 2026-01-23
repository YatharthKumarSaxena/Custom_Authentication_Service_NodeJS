const crypto = require("crypto");
const { link } = require("@configs/security.config");

const {
  length,
  algorithm,
  encoding,
  secret
} = link;

/**
 * Generate opaque random verification token
 */
const generateLinkToken = (len = length) => {
  return crypto.randomBytes(len).toString(encoding);
};

/**
 * Hash token using server secret (HMAC)
 */
const hashLinkToken = (token) => {
  return crypto
    .createHmac(algorithm, secret)
    .update(token)
    .digest(encoding);
};

/**
 * Verify token safely
 */
const verifyLinkToken = (inputToken, storedHash) => {
  const inputHash = crypto
    .createHmac(algorithm, secret)
    .update(inputToken)
    .digest(encoding);

  return crypto.timingSafeEqual(
    Buffer.from(inputHash, encoding),
    Buffer.from(storedHash, encoding)
  );
};

module.exports = {
  generateLinkToken,
  hashLinkToken,
  verifyLinkToken
};
