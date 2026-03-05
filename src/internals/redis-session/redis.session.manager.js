/**
 * Redis Session Manager
 * 
 * Manages distributed session storage with token versioning.
 * Enforces one refresh token per device policy.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const { getRedisClient } = require('@utils/redis-client.util');
const { buildRedisKey, buildRefreshTokenFamilyKey, validateKeyComponents } = require('./redis.key.builder');
const { REDIS } = require('../constants');
const { logWithTime } = require('@/utils/time-stamps.util');

/**
 * Store session in Redis
 * @param {Object} params - { userId, deviceUUID, refreshToken }
 * @returns {Promise<boolean>} Success status
 */
const storeSession = async ({ userId, deviceUUID, refreshToken }) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        const sessionData = {
            refreshToken,
            version: 1,
            rotatedAt: Date.now(),
            userId, // Keep for quick reference (encrypted in Redis)
            deviceUUID
        };

        // Store with TTL
        await redisClient.setex(
            redisKey,
            REDIS.SESSION_TTL,
            JSON.stringify(sessionData)
        );

        // Track in family set
        const familyKey = buildRefreshTokenFamilyKey(userId);
        await redisClient.sadd(familyKey, deviceUUID);
        await redisClient.expire(familyKey, REDIS.SESSION_TTL);

        logWithTime(`✅ Session stored in Redis for user: ${userId.substring(0, 8)}...`);
        return true;
    } catch (error) {
        logWithTime(`❌ Failed to store session: ${error.message}`);
        throw error;
    }
};

/**
 * Get session from Redis
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {Promise<Object|null>} Session data or null
 */
const getSession = async (userId, deviceUUID) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        const sessionData = await redisClient.get(redisKey);

        if (!sessionData) {
            return null;
        }

        return JSON.parse(sessionData);
    } catch (error) {
        logWithTime(`❌ Failed to get session: ${error.message}`);
        throw error;
    }
};

/**
 * Update session with new tokens (rotation)
 * @param {Object} params - { userId, deviceUUID, refreshToken }
 * @returns {Promise<boolean>} Success status
 */
const rotateSession = async ({ userId, deviceUUID, refreshToken }) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        // Get current session to increment version
        const currentSession = await getSession(userId, deviceUUID);
        const version = currentSession ? currentSession.version + 1 : 1;

        const sessionData = {
            refreshToken,
            version,
            rotatedAt: Date.now(),
            userId,
            deviceUUID
        };

        // Update with new TTL
        await redisClient.setex(
            redisKey,
            REDIS.SESSION_TTL,
            JSON.stringify(sessionData)
        );

        logWithTime(`🔄 Session rotated for user: ${userId.substring(0, 8)}... (version: ${version})`);
        return true;
    } catch (error) {
        logWithTime(`❌ Failed to rotate session: ${error.message}`);
        throw error;
    }
};

/**
 * Delete session from Redis
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {Promise<boolean>} Success status
 */
const deleteSession = async (userId, deviceUUID) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        await redisClient.del(redisKey);

        // Remove from family set
        const familyKey = buildRefreshTokenFamilyKey(userId);
        await redisClient.srem(familyKey, deviceUUID);

        logWithTime(`🗑️  Session deleted for user: ${userId.substring(0, 8)}...`);
        return true;
    } catch (error) {
        logWithTime(`❌ Failed to delete session: ${error.message}`);
        throw error;
    }
};

/**
 * Delete all sessions for a user (logout from all devices)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of sessions deleted
 */
const deleteAllUserSessions = async (userId) => {
    try {
        const redisClient = getRedisClient();
        const familyKey = buildRefreshTokenFamilyKey(userId);

        // Get all device UUIDs for this user
        const deviceUUIDs = await redisClient.smembers(familyKey);

        if (!deviceUUIDs || deviceUUIDs.length === 0) {
            return 0;
        }

        // Delete each session
        const deletePromises = deviceUUIDs.map(deviceUUID => 
            deleteSession(userId, deviceUUID)
        );

        await Promise.all(deletePromises);

        // Delete family set
        await redisClient.del(familyKey);

        logWithTime(`🗑️  All sessions deleted for user: ${userId.substring(0, 8)}... (${deviceUUIDs.length} devices)`);
        return deviceUUIDs.length;
    } catch (error) {
        logWithTime(`❌ Failed to delete all user sessions: ${error.message}`);
        throw error;
    }
};

/**
 * Check if session exists
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {Promise<boolean>} true if exists
 */
const sessionExists = async (userId, deviceUUID) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        const exists = await redisClient.exists(redisKey);
        return exists === 1;
    } catch (error) {
        logWithTime(`❌ Failed to check session existence: ${error.message}`);
        throw error;
    }
};

/**
 * Get all active devices for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<string>>} List of device UUIDs
 */
const getUserDevices = async (userId) => {
    try {
        const redisClient = getRedisClient();
        const familyKey = buildRefreshTokenFamilyKey(userId);

        const deviceUUIDs = await redisClient.smembers(familyKey);
        return deviceUUIDs || [];
    } catch (error) {
        logWithTime(`❌ Failed to get user devices: ${error.message}`);
        throw error;
    }
};

/**
 * Get session TTL (time to live)
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @returns {Promise<number>} TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
 */
const getSessionTTL = async (userId, deviceUUID) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        return await redisClient.ttl(redisKey);
    } catch (error) {
        logWithTime(`❌ Failed to get session TTL: ${error.message}`);
        throw error;
    }
};

/**
 * Extend session TTL (refresh expiration)
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @param {number} ttl - New TTL in seconds (default: REDIS.SESSION_TTL)
 * @returns {Promise<boolean>} Success status
 */
const extendSessionTTL = async (userId, deviceUUID, ttl = REDIS.SESSION_TTL) => {
    try {
        validateKeyComponents(userId, deviceUUID);

        const redisClient = getRedisClient();
        const redisKey = buildRedisKey(userId, deviceUUID);

        const result = await redisClient.expire(redisKey, ttl);
        return result === 1;
    } catch (error) {
        logWithTime(`❌ Failed to extend session TTL: ${error.message}`);
        throw error;
    }
};

module.exports = {
    storeSession,
    getSession,
    rotateSession,
    deleteSession,
    deleteAllUserSessions,
    sessionExists,
    getUserDevices,
    getSessionTTL,
    extendSessionTTL
};