/**
 * Redis Key Builder
 * 
 * Cryptographically secure key generation for Redis storage.
 * Prevents userId and deviceUUID discovery if Redis is compromised.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const crypto = require('crypto');
const { REDIS } = require('../constants');
const { hashing } = require('@/configs/security.config');

/**
 * Generate cryptographic hash for Redis key
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {string} Hashed key
 */
const generateHashedKey = (userId, deviceUUID) => {
    if (!userId || !deviceUUID) {
        throw new Error('userId and deviceUUID are required for key generation');
    }

    // Combine userId, deviceUUID, and salt
    const rawKey = `${userId}:${deviceUUID}:${REDIS.KEY_SALT}`;

    // Generate SHA-256 hash
    const hash = crypto
        .createHash(hashing.algorithm)
        .update(rawKey)
        .digest(hashing.encoding);

    return hash;
};

/**
 * Build full Redis key with prefix
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {string} Full Redis key (e.g., "auth:session:<hash>")
 */
const buildRedisKey = (userId, deviceUUID) => {
    const hashedKey = generateHashedKey(userId, deviceUUID);
    return `${REDIS.KEY_PREFIX}${hashedKey}`;
};

/**
 * Build refresh token family key
 * Used to track all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {string} Refresh token family key
 */
const buildRefreshTokenFamilyKey = (userId) => {
    if (!userId) {
        throw new Error('userId is required for refresh token family key');
    }

    return `${REDIS.KEY_PREFIX}family:${userId}`;
};

/**
 * Validate key components
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {boolean} true if valid
 */
const validateKeyComponents = (userId, deviceUUID) => {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid userId: must be a non-empty string');
    }

    if (!deviceUUID || typeof deviceUUID !== 'string' || deviceUUID.trim() === '') {
        throw new Error('Invalid deviceUUID: must be a non-empty string');
    }

    return true;
};

/**
 * Parse Redis key (for debugging only - cannot reverse hash)
 * @param {string} redisKey - Full Redis key
 * @returns {Object} { prefix, hash }
 */
const parseRedisKey = (redisKey) => {
    if (!redisKey || !redisKey.startsWith(REDIS.KEY_PREFIX)) {
        throw new Error('Invalid Redis key format');
    }

    const hash = redisKey.replace(REDIS.KEY_PREFIX, '');

    return {
        prefix: REDIS.KEY_PREFIX,
        hash,
        isValid: hash.length === 64 // SHA-256 produces 64 hex characters
    };
};

module.exports = {
    generateHashedKey,
    buildRedisKey,
    buildRefreshTokenFamilyKey,
    validateKeyComponents,
    parseRedisKey
};