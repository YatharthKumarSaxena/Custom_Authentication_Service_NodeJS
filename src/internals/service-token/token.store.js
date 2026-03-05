/**
 * Service Token Store
 * 
 * Database operations for service token management.
 * Handles CRUD operations with hashed token storage.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const { ServiceToken } = require('@models/index');
const { hashServiceToken } = require('./token.generator');

/**
 * Store new service token in database
 * @param {Object} tokenData - { token, serviceName, serviceInstanceId, expiresAt }
 * @returns {Promise<Object>} Saved token document
 */
const storeServiceToken = async ({ token, serviceName, serviceInstanceId, expiresAt }) => {
    try {
        const tokenHash = hashServiceToken(token);

        // Deactivate old tokens for this service
        await ServiceToken.deactivateOldTokens(serviceName, tokenHash);

        // Create new token record
        const serviceToken = new ServiceToken({
            serviceName,
            serviceInstanceId,
            tokenHash,
            expiresAt,
            isActive: true,
            rotatedAt: new Date()
        });

        return await serviceToken.save();
    } catch (error) {
        throw new Error(`Failed to store service token: ${error.message}`);
    }
};

/**
 * Find active token by service name
 * @param {string} serviceName - Name of the service
 * @returns {Promise<Object|null>} Token document or null
 */
const findActiveToken = async (serviceName) => {
    try {
        return await ServiceToken.findActiveByServiceName(serviceName);
    } catch (error) {
        throw new Error(`Failed to find active token: ${error.message}`);
    }
};

/**
 * Verify token hash exists and is active
 * @param {string} token - Raw token to verify
 * @returns {Promise<Object|null>} Token document if valid
 */
const verifyTokenInDatabase = async (token) => {
    try {
        const tokenHash = hashServiceToken(token);
        
        return await ServiceToken.findOne({
            tokenHash,
            isActive: true,
            expiresAt: { $gt: new Date() }
        });
    } catch (error) {
        throw new Error(`Failed to verify token in database: ${error.message}`);
    }
};

/**
 * Deactivate a specific token
 * @param {string} token - Raw token to deactivate
 * @returns {Promise<boolean>} true if deactivated
 */
const deactivateToken = async (token) => {
    try {
        const tokenHash = hashServiceToken(token);
        
        const result = await ServiceToken.updateOne(
            { tokenHash },
            { $set: { isActive: false } }
        );

        return result.modifiedCount > 0;
    } catch (error) {
        throw new Error(`Failed to deactivate token: ${error.message}`);
    }
};

/**
 * Clean up expired tokens
 * @returns {Promise<number>} Number of deleted tokens
 */
const cleanupExpiredTokens = async () => {
    try {
        const result = await ServiceToken.cleanupExpiredTokens();
        return result.deletedCount || 0;
    } catch (error) {
        throw new Error(`Failed to cleanup expired tokens: ${error.message}`);
    }
};

/**
 * Get all active tokens for monitoring
 * @returns {Promise<Array>} List of active tokens
 */
const getAllActiveTokens = async () => {
    try {
        return await ServiceToken.find({
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).select('-tokenHash').sort({ createdAt: -1 });
    } catch (error) {
        throw new Error(`Failed to get active tokens: ${error.message}`);
    }
};

/**
 * Increment rotation count
 * @param {string} serviceName - Service name
 * @returns {Promise<boolean>} Success status
 */
const incrementRotationCount = async (serviceName) => {
    try {
        const result = await ServiceToken.updateOne(
            { 
                serviceName, 
                isActive: true,
                expiresAt: { $gt: new Date() }
            },
            { 
                $inc: { 'metadata.rotationCount': 1 },
                $set: { rotatedAt: new Date() }
            }
        );

        return result.modifiedCount > 0;
    } catch (error) {
        throw new Error(`Failed to increment rotation count: ${error.message}`);
    }
};

module.exports = {
    storeServiceToken,
    findActiveToken,
    verifyTokenInDatabase,
    deactivateToken,
    cleanupExpiredTokens,
    getAllActiveTokens,
    incrementRotationCount
};