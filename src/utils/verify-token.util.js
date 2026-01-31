const jwt = require("jsonwebtoken");
const { secretCodeOfAccessToken, secretCodeOfRefreshToken } = require("@configs/token.config");
const { logWithTime } = require("./time-stamps.util");
const { Token } = require("@configs/enums.config");

/**
 * Determines the secret key based on the expected token type.
 */
const getSecret = (tokenType) => {
    return (tokenType === Token.REFRESH) ? secretCodeOfRefreshToken : secretCodeOfAccessToken;
}

/**
 * Verifies and Decodes a JWT Token.
 * @param {string} token - The JWT string to verify.
 * @param {string} type - Enum: Token.ACCESS or Token.REFRESH (Default: ACCESS)
 * @returns {object} - Decoded payload (uid, did, iat, exp)
 * @throws {Error} - If token is invalid or expired.
 */

const verifyToken = (token, type = Token.ACCESS) => {
    try {
        const secret = getSecret(type);
        
        const decoded = jwt.verify(token, secret);

        logWithTime(`🔓 ${type} Token verified for User: ${decoded.uid}`);

        return decoded; 

    } catch (error) {
        logWithTime(`❌ ${type} Token Verification Failed: ${error.message}`);
        // Error ko upar bubble hone denge taaki Middleware/Controller ise handle kare (e.g. 401 Unauthorized)
        throw error;
    }
};

/**
 * Decodes a token WITHOUT verifying signature.
 * Useful ONLY to extract info (like checking expiry time) even if token is invalid.
 * WARNING: Do not use this for Authentication checks!
 */

const decodeTokenUnsafe = (token) => {
    return jwt.decode(token);
}

module.exports = {
    verifyToken,
    decodeTokenUnsafe
};