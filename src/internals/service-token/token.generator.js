/**
 * Service Token Generator
 * 
 * Generates JWT-based service tokens for service-to-service communication.
 * These tokens are short-lived and distinct from user authentication tokens.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const os = require('os');
const { SERVICE_TOKEN, SERVICE_NAMES } = require('../constants');
const { hashing } = require('@/configs/security.config');

/**
 * Generate unique service instance ID
 * Combines hostname, process ID, and timestamp for uniqueness
 */
const generateServiceInstanceId = () => {
    const hostname = os.hostname();
    const pid = process.pid;
    const timestamp = Date.now();
    return `${hostname}-${pid}-${timestamp}`;
};

/**
 * Generate service token
 * @param {string} serviceName - Name of the service requesting the token
 * @returns {Object} { token, expiresAt, serviceInstanceId }
 */
const generateServiceToken = (serviceName = SERVICE_NAMES.AUTH_SERVICE) => {
    if (!SERVICE_TOKEN.SECRET) {
        throw new Error('SERVICE_TOKEN_SECRET is not configured');
    }

    const serviceInstanceId = generateServiceInstanceId();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + SERVICE_TOKEN.EXPIRY;

    const payload = {
        serviceName,
        serviceInstanceId,
        iat: now,
        exp: expiresAt,
        type: 'service-token'
    };

    const token = jwt.sign(payload, SERVICE_TOKEN.SECRET, {
        algorithm: SERVICE_TOKEN.ALGORITHM
    });

    return {
        token,
        expiresAt: new Date(expiresAt * 1000),
        serviceInstanceId,
        serviceName
    };
};

/**
 * Hash service token for storage
 * Never store raw tokens in database
 * @param {string} token - The raw JWT token
 * @returns {string} SHA-256 hash of the token
 */
const hashServiceToken = (token) => {
    return crypto
        .createHash(hashing.algorithm)
        .update(token)
        .digest(hashing.encoding);
};

/**
 * Verify service token
 * @param {string} token - The token to verify
 * @returns {Object} Decoded payload if valid
 */
const verifyServiceToken = (token) => {
    try {
        if (!SERVICE_TOKEN.SECRET) {
            throw new Error('SERVICE_TOKEN_SECRET is not configured');
        }

        const decoded = jwt.verify(token, SERVICE_TOKEN.SECRET, {
            algorithms: [SERVICE_TOKEN.ALGORITHM]
        });

        // Ensure it's a service token
        if (decoded.type !== 'service-token') {
            throw new Error('Invalid token type');
        }

        return decoded;
    } catch (error) {
        throw new Error(`Token verification failed: ${error.message}`);
    }
};

/**
 * Check if token needs rotation
 * @param {Date} expiresAt - Token expiration date
 * @returns {boolean} true if token should be rotated
 */
const shouldRotateToken = (expiresAt) => {
    const now = Date.now();
    const expiryTime = new Date(expiresAt).getTime();
    const timeRemaining = (expiryTime - now) / 1000; // in seconds

    return timeRemaining < SERVICE_TOKEN.ROTATION_THRESHOLD;
};

/**
 * Get time remaining until expiration
 * @param {Date} expiresAt - Token expiration date
 * @returns {number} Seconds remaining
 */
const getTimeRemaining = (expiresAt) => {
    const now = Date.now();
    const expiryTime = new Date(expiresAt).getTime();
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
};

module.exports = {
    generateServiceToken,
    hashServiceToken,
    verifyServiceToken,
    shouldRotateToken,
    getTimeRemaining,
    generateServiceInstanceId
};
