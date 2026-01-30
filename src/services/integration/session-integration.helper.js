/**
 * 🔌 Session Integration Helper
 * 
 * Helper functions to integrate Redis sessions in microservice mode
 * without breaking monolithic mode functionality.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const { logWithTime } = require('@/utils/time-stamps.util');
const { microserviceConfig } = require('@configs/microservice.config');

// Dynamically load internal modules only in microservice mode
let redisSession = null;
if (microserviceConfig.enabled) {
    try {
        const internal = require('@internals');
        if (internal && internal.redisSession) {
            redisSession = internal.redisSession;
        }
    } catch (error) {
        logWithTime('❌ Failed to load internal modules:', error.message);
    }
}

/**
 * Store session after successful authentication
 * In microservice mode: Store in Redis
 * In monolithic mode: No-op (database only)
 * 
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
const storeAuthSession = async (userId, deviceUUID, refreshToken) => {
    if (!microserviceConfig.enabled || !redisSession) {
        // Monolithic mode - no Redis storage
        return;
    }

    try {
        await redisSession.storeSession({
            userId,
            deviceUUID,
            refreshToken
        });
    } catch (error) {
        // Don't fail authentication if Redis fails
        // Database is the source of truth
        logWithTime(`⚠️  Failed to store session in Redis: ${error.message}`);
    }
};

/**
 * Delete session on logout
 * In microservice mode: Delete from Redis
 * In monolithic mode: No-op
 * 
 * @param {string} userId - User ID
 * @param {string} deviceUUID - Device UUID
 */
const deleteAuthSession = async (userId, deviceUUID) => {
    if (!microserviceConfig.enabled || !redisSession) {
        return;
    }

    try {
        await redisSession.deleteSession(userId, deviceUUID);
    } catch (error) {
        logWithTime(`⚠️  Failed to delete session from Redis: ${error.message}`);
    }
};

/**
 * Delete all user sessions on logout from all devices
 * In microservice mode: Delete all from Redis
 * In monolithic mode: No-op
 * 
 * @param {string} userId - User ID
 */
const deleteAllAuthSessions = async (userId) => {
    if (!microserviceConfig.enabled || !redisSession) {
        return;
    }

    try {
        await redisSession.deleteAllUserSessions(userId);
    } catch (error) {
        logWithTime(`⚠️  Failed to delete all sessions from Redis: ${error.message}`);
    }
};

/**
 * Sync admin identity with Admin Panel Service
 * In microservice mode: Call internal API
 * In monolithic mode: No-op
 * 
 * @param {string} adminId - Admin user ID
 * @param {string} action - 'bootstrap' | 'identity-sync' | 'account-state'
 * @param {Object} data - Additional data for the action
 */
const syncAdminIdentity = async (adminId, action, data = {}) => {
    if (!microserviceConfig.enabled) {
        return { success: true, mode: 'monolithic' };
    }

    try {
        const internal = require('@internals');
        if (!internal || !internal.clients) {
            logWithTime('❌ Internal clients not available');
            return { success: false, error: 'Internal clients not available' };
        }

        const { adminPanelClient } = internal.clients;

        switch (action) {
            case 'bootstrap':
                return await adminPanelClient.bootstrapSuperAdmin(adminId);
            
            case 'identity-sync':
                return await adminPanelClient.syncIdentityState(adminId, data.isVerified);
            
            case 'account-state':
                return await adminPanelClient.syncAccountState(adminId, data.isBlocked, data.isActive);
            
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        logWithTime(`❌ Failed to sync admin identity: ${error.message}`);
        throw error;
    }
};

/**
 * Check if microservice mode is enabled
 * @returns {boolean}
 */
const isMicroserviceMode = () => {
    return microserviceConfig.enabled;
};

module.exports = {
    storeAuthSession,
    deleteAuthSession,
    deleteAllAuthSessions,
    syncAdminIdentity,
    isMicroserviceMode
};
