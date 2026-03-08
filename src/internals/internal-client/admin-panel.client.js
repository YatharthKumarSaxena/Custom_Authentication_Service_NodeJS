/**
 * Admin Panel Service Client
 * 
 * Internal API client for communicating with Admin Panel Service.
 * Handles identity bootstrapping, sync operations, and state management.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const { getServiceToken } = require('../service-token');
const { INTERNAL_API, SERVICE_NAMES } = require('../constants');
const { logWithTime } = require('@/utils/time-stamps.util');
const { createInternalServiceClient } = require('@/utils/internal-service-client.util');
const { ADMIN_PANEL_URIS } = require('@/configs/internal-uri.config');


/**
 * Get authenticated Admin Panel Service client
 * @returns {Promise<Object>} Client with callService method
 */
const getAdminPanelClient = async () => {
    const serviceToken = await getServiceToken(SERVICE_NAMES.AUTH_SERVICE);
    
    return createInternalServiceClient(
        INTERNAL_API.ADMIN_PANEL_BASE_URL,
        serviceToken,
        SERVICE_NAMES.AUTH_SERVICE,
        INTERNAL_API.TIMEOUT,
        INTERNAL_API.RETRY_ATTEMPTS,
        INTERNAL_API.RETRY_DELAY 
    );
};

/**
 * Bootstrap super admin identity in Admin Panel Service
 * 
 * @param {string} adminId - User ID of the super admin
 * @returns {Promise<Object>} Response from Admin Panel Service
 */
const bootstrapSuperAdmin = async (adminId) => {
    try {
        logWithTime(`🚀 Bootstrapping super admin: ${adminId.substring(0, 8)}...`);

        const client = await getAdminPanelClient();
        const result = await client.callService({
            method: ADMIN_PANEL_URIS.BOOTSTRAP_ADMIN.method,
            uri: ADMIN_PANEL_URIS.BOOTSTRAP_ADMIN.uri,
            body: { adminId }
        });

        if (result.success) {
            logWithTime(`✅ Super admin bootstrapped successfully`);
            return result.data;
        } else {
            throw new Error(result.error || 'Bootstrap failed');
        }
    } catch (error) {
        logWithTime(`❌ Failed to bootstrap super admin: ${error.message}`);
        throw error;
    }
};

/**
 * Sync identity verification state
 * 
 * @param {string} adminId - User ID of the admin
 * @param {boolean} isVerified - Verification status
 * @returns {Promise<Object>} Response from Admin Panel Service
 */
const syncIdentityState = async (adminId, isVerified) => {
    try {
        logWithTime(`🔄 Syncing identity state for admin: ${adminId.substring(0, 8)}...`);

        const client = await getAdminPanelClient();
        const result = await client.callService({
            method: ADMIN_PANEL_URIS.SYNC_IDENTITY_STATE.method,
            uri: ADMIN_PANEL_URIS.SYNC_IDENTITY_STATE.uri,
            body: { adminId, isVerified }
        });

        if (result.success) {
            logWithTime(`✅ Identity state synced successfully`);
            return result.data;
        } else {
            throw new Error(result.error || 'Sync failed');
        }
    } catch (error) {
        logWithTime(`❌ Failed to sync identity state: ${error.message}`);
        throw error;
    }
};

/**
 * Sync account state (blocked/active status)
 * 
 * @param {string} adminId - User ID of the admin
 * @param {boolean} isBlocked - Whether account is blocked
 * @param {boolean} isActive - Whether account is active
 * @returns {Promise<Object>} Response from Admin Panel Service
 */
const syncAccountState = async (adminId, isBlocked, isActive) => {
    try {
        logWithTime(`🔄 Syncing account state for admin: ${adminId.substring(0, 8)}...`);

        const client = await getAdminPanelClient();
        const result = await client.callService({
            method: ADMIN_PANEL_URIS.SYNC_ACCOUNT_STATE.method,
            uri: ADMIN_PANEL_URIS.SYNC_ACCOUNT_STATE.uri,
            body: { adminId, isBlocked, isActive }
        });

        if (result.success) {
            logWithTime(`✅ Account state synced successfully`);
            return result.data;
        } else {
            throw new Error(result.error || 'Sync failed');
        }
    } catch (error) {
        logWithTime(`❌ Failed to sync account state: ${error.message}`);
        throw error;
    }
};

/**
 * Rollback admin creation (compensating transaction)
 * Called when admin creation fails in Admin Panel Service
 * 
 * @param {string} adminId - User ID of the admin to rollback
 * @returns {Promise<Object>} Response from Admin Panel Service
 */
const rollbackAdminCreation = async (adminId) => {
    try {
        logWithTime(`↩️  Rolling back admin creation: ${adminId.substring(0, 8)}...`);

        const client = await getAdminPanelClient();
        const uri = ADMIN_PANEL_URIS.ROLLBACK_ADMIN.uri.replace(':adminId', adminId);
        const result = await client.callService({
            method: ADMIN_PANEL_URIS.ROLLBACK_ADMIN.method,
            uri
        });

        if (result.success) {
            logWithTime(`✅ Admin creation rolled back successfully`);
            return result.data;
        } else {
            throw new Error(result.error || 'Rollback failed');
        }
    } catch (error) {
        logWithTime(`❌ Failed to rollback admin creation: ${error.message}`);
        logWithTime('⚠️  CRITICAL: Manual intervention may be required');
        logWithTime(`Admin ID: ${adminId}`);
        throw error;
    }
};

/**
 * Health check for Admin Panel Service
 * 
 * @returns {Promise<Object>} Health status response
 */
const healthCheck = async () => {
    try {
        logWithTime('🏥 Checking Admin Panel Service health...');
        
        const client = await getAdminPanelClient();
        const result = await client.callService({
            method: ADMIN_PANEL_URIS.HEALTH_CHECK.method,
            uri: ADMIN_PANEL_URIS.HEALTH_CHECK.uri
        });

        if (result.success && result.data?.success === true) {
            logWithTime('✅ Admin Panel is live');
            return {
                success: true,
                data: result.data
            };
        } else {
            logWithTime('⚠️  Admin Panel responded but status is not healthy');
            return {
                success: false,
                error: result.error || 'Service not healthy'
            };
        }
    } catch (error) {
        logWithTime(`❌ Admin Panel Service health check failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create super admin in Admin Panel Service
 * This is called during bootstrap after the super admin is created in Auth Service
 * 
 * @param {Object} adminData - Super admin data
 * @param {string} adminData.adminId - Admin ID of the super admin
 * @param {string} [adminData.email] - Email address (if applicable)
 * @param {string} [adminData.phone] - Phone number (if applicable)
 * @param {string} [adminData.firstName] - First name (if provided)
 * @returns {Promise<Object>} Response from Admin Panel Service
 */
const createSuperAdminInAdminPanel = async (adminData) => {
    try {
        logWithTime(`🚀 Creating super admin in Admin Panel Service: ${adminData.adminId.substring(0, 8)}...`);

        const client = await getAdminPanelClient();
        const result = await client.callService({
            method: ADMIN_PANEL_URIS.CREATE_SUPER_ADMIN.method,
            uri: ADMIN_PANEL_URIS.CREATE_SUPER_ADMIN.uri,
            body: adminData
        });
        
        if (result.success && result.data?.success) {
            logWithTime(`✅ Super admin created successfully in Admin Panel Service`);
            return {
                success: true,
                data: result.data
            };
        } else {
            logWithTime(`⚠️  Unexpected response from Admin Panel Service`);
            return {
                success: false,
                error: result.error || 'Creation failed',
                details: result.data
            };
        }
    } catch (error) {
        logWithTime(`❌ Failed to create super admin in Admin Panel Service: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    bootstrapSuperAdmin,
    syncIdentityState,
    syncAccountState,
    rollbackAdminCreation,
    healthCheck,
    createSuperAdminInAdminPanel
};