/**
 * Service Token Rotator
 * 
 * Handles automatic token rotation based on threshold.
 * Ensures service tokens are refreshed before expiration.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const { generateServiceToken, shouldRotateToken, getTimeRemaining } = require('./token.generator');
const { storeServiceToken, findActiveToken, incrementRotationCount } = require('./token.store');
const { SERVICE_NAMES } = require('../constants');
const { logWithTime } = require('@/utils/time-stamps.util');

// In-memory cache for current active token
let currentToken = null;
let rotationInProgress = false;

/**
 * Initialize service token on application startup
 * @param {string} serviceName - Name of the service
 * @returns {Promise<Object>} { token, expiresAt }
 */
const initializeServiceToken = async (serviceName = SERVICE_NAMES.AUTH_SERVICE) => {
    try {
        logWithTime(`🔐 Initializing service token for: ${serviceName}`);

        // Generate new token
        const tokenData = generateServiceToken(serviceName);

        // Store in database (hashed)
        await storeServiceToken(tokenData);

        // Cache in memory
        currentToken = {
            token: tokenData.token,
            expiresAt: tokenData.expiresAt,
            serviceName: tokenData.serviceName
        };

        const timeRemaining = getTimeRemaining(tokenData.expiresAt);
        logWithTime(`✅ Service token initialized. Expires in ${timeRemaining} seconds`);

        return currentToken;
    } catch (error) {
        logWithTime(`❌ Failed to initialize service token: ${error.message}`);
        throw error;
    }
};

/**
 * Get current service token (with automatic rotation)
 * @param {string} serviceName - Name of the service
 * @returns {Promise<string>} Current valid token
 */
const getServiceToken = async (serviceName = SERVICE_NAMES.AUTH_SERVICE) => {
    try {
        // If no token in memory, try to load from DB
        if (!currentToken) {
            const dbToken = await findActiveToken(serviceName);
            if (dbToken && new Date(dbToken.expiresAt) > new Date()) {
                logWithTime('⚠️  No cached token. Cannot retrieve raw token from DB (security).');
                logWithTime('🔄 Generating new token...');
                return (await initializeServiceToken(serviceName)).token;
            } else {
                // No valid token, initialize
                return (await initializeServiceToken(serviceName)).token;
            }
        }

        // Check if rotation is needed
        if (shouldRotateToken(currentToken.expiresAt)) {
            await rotateServiceToken(serviceName);
        }

        return currentToken.token;
    } catch (error) {
        logWithTime(`❌ Failed to get service token: ${error.message}`);
        throw error;
    }
};

/**
 * Rotate service token
 * @param {string} serviceName - Name of the service
 * @returns {Promise<Object>} New token data
 */
const rotateServiceToken = async (serviceName = SERVICE_NAMES.AUTH_SERVICE) => {
    // Prevent concurrent rotation
    if (rotationInProgress) {
        logWithTime('⏳ Token rotation already in progress...');
        return currentToken;
    }

    rotationInProgress = true;

    try {
        logWithTime(`🔄 Rotating service token for: ${serviceName}`);

        // Generate new token
        const tokenData = generateServiceToken(serviceName);

        // Store in database
        await storeServiceToken(tokenData);

        // Increment rotation count
        await incrementRotationCount(serviceName);

        // Update cache
        currentToken = {
            token: tokenData.token,
            expiresAt: tokenData.expiresAt,
            serviceName: tokenData.serviceName
        };

        const timeRemaining = getTimeRemaining(tokenData.expiresAt);
        logWithTime(`✅ Service token rotated. New token expires in ${timeRemaining} seconds`);

        return currentToken;
    } catch (error) {
        logWithTime(`❌ Failed to rotate service token: ${error.message}`);
        throw error;
    } finally {
        rotationInProgress = false;
    }
};

/**
 * Force token rotation (manual trigger)
 * @param {string} serviceName - Name of the service
 * @returns {Promise<Object>} New token data
 */
const forceRotateToken = async (serviceName = SERVICE_NAMES.AUTH_SERVICE) => {
    logWithTime(`🔧 Force rotating service token for: ${serviceName}`);
    return await rotateServiceToken(serviceName);
};

/**
 * Get token status
 * @returns {Object|null} Current token status
 */
const getTokenStatus = () => {
    if (!currentToken) {
        return null;
    }

    const timeRemaining = getTimeRemaining(currentToken.expiresAt);
    const needsRotation = shouldRotateToken(currentToken.expiresAt);

    return {
        serviceName: currentToken.serviceName,
        expiresAt: currentToken.expiresAt,
        timeRemaining,
        needsRotation,
        status: timeRemaining > 0 ? 'active' : 'expired'
    };
};

/**
 * Clear cached token (for testing or shutdown)
 */
const clearTokenCache = () => {
    currentToken = null;
    rotationInProgress = false;
    logWithTime('🗑️  Token cache cleared');
};

module.exports = {
    initializeServiceToken,
    getServiceToken,
    rotateServiceToken,
    forceRotateToken,
    getTokenStatus,
    clearTokenCache
};