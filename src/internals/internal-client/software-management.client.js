/**
 * Software Management Service Client
 * 
 * Internal API client for communicating with Software Management Service.
 * Handles license management, software registration, and related operations.
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
const { logWithTime } = require('@utils/time-stamps.util');
const { createInternalServiceClient } = require('@/utils/internal-service-client.util');
const { SOFTWARE_MANAGEMENT_URIS } = require('@/configs/internal-uri.config');

/**
 * Get authenticated Software Management Service client
 * @returns {Promise<Object>} Client with callService method
 */
const getSoftwareManagementClient = async () => {
    const serviceToken = await getServiceToken(SERVICE_NAMES.AUTH_SERVICE);
    
    return createInternalServiceClient(
        INTERNAL_API.SOFTWARE_MANAGEMENT_BASE_URL,
        serviceToken,
        SERVICE_NAMES.AUTH_SERVICE,
        INTERNAL_API.TIMEOUT,
        INTERNAL_API.RETRY_ATTEMPTS,
        INTERNAL_API.RETRY_DELAY
    );
};

/**
 * Notify Software Management Service about user creation
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response from Software Management Service
 */
const notifyUserCreation = async (userId) => {
    try {
        logWithTime(`📢 Notifying Software Management Service about user creation: ${userId.substring(0, 8)}...`);

        const client = await getSoftwareManagementClient();
        const result = await client.callService({
            method: SOFTWARE_MANAGEMENT_URIS.NOTIFY_USER_CREATED.method,
            uri: SOFTWARE_MANAGEMENT_URIS.NOTIFY_USER_CREATED.uri,
            body: { userId }
        });

        if (result.success) {
            logWithTime(`✅ User creation notification sent successfully`);
            return result.data;
        } else {
            throw new Error(result.error || 'Notification failed');
        }
    } catch (error) {
        logWithTime(`❌ Failed to notify user creation: ${error.message}`);
        throw error;
    }
};

/**
 * Sync user account state
 * 
 * @param {string} userId - User ID
 * @param {boolean} isActive - Whether account is active
 * @returns {Promise<Object>} Response from Software Management Service
 */
const syncUserAccountState = async (userId, isActive) => {
    try {
        logWithTime(`🔄 Syncing user account state: ${userId.substring(0, 8)}...`);

        const client = await getSoftwareManagementClient();
        const result = await client.callService({
            method: SOFTWARE_MANAGEMENT_URIS.SYNC_USER_ACCOUNT_STATE.method,
            uri: SOFTWARE_MANAGEMENT_URIS.SYNC_USER_ACCOUNT_STATE.uri,
            body: { userId, isActive }
        });

        if (result.success) {
            logWithTime(`✅ User account state synced successfully`);
            return result.data;
        } else {
            throw new Error(result.error || 'Sync failed');
        }
    } catch (error) {
        logWithTime(`❌ Failed to sync user account state: ${error.message}`);
        throw error;
    }
};

/**
 * Health check for Software Management Service
 * 
 * @returns {Promise<Object>} Health status response
 */
const healthCheck = async () => {
    try {
        logWithTime('🏥 Checking Software Management Service health...');
        
        const client = await getSoftwareManagementClient();
        const result = await client.callService({
            method: SOFTWARE_MANAGEMENT_URIS.HEALTH_CHECK.method,
            uri: SOFTWARE_MANAGEMENT_URIS.HEALTH_CHECK.uri
        });

        if (result.success && result.data?.success === true) {
            logWithTime('✅ Software Management Service is live');
            return {
                success: true,
                data: result.data
            };
        } else {
            logWithTime('⚠️  Software Management Service responded but status is not healthy');
            return {
                success: false,
                error: result.error || 'Service not healthy'
            };
        }
    } catch (error) {
        logWithTime(`❌ Software Management Service health check failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create super admin in Software Management Service
 * This is called during bootstrap after the super admin is created in Auth Service
 * 
 * @param {Object} adminData - Super admin data
 * @param {string} adminData.adminId - Admin ID of the super admin
 * @param {string} [adminData.email] - Email address (if applicable)
 * @param {string} [adminData.phone] - Phone number (if applicable)
 * @param {string} [adminData.firstName] - First name (if provided)
 * @returns {Promise<Object>} Response from Software Management Service
 */
const createSuperAdminInSoftwareManagement = async (adminData) => {
    try {
        logWithTime(`🚀 Creating super admin in Software Management Service: ${adminData.adminId.substring(0, 8)}...`);

        const client = await getSoftwareManagementClient();
        const result = await client.callService({
            method: SOFTWARE_MANAGEMENT_URIS.CREATE_SUPER_ADMIN.method,
            uri: SOFTWARE_MANAGEMENT_URIS.CREATE_SUPER_ADMIN.uri,
            body: adminData
        });
        
        if (result.success && result.data?.success) {
            logWithTime(`✅ Super admin created successfully in Software Management Service`);
            return {
                success: true,
                data: result.data
            };
        } else {
            logWithTime(`⚠️  Unexpected response from Software Management Service`);
            return {
                success: false,
                error: result.error || 'Creation failed',
                details: result.data
            };
        }
    } catch (error) {
        logWithTime(`❌ Failed to create super admin in Software Management Service: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    notifyUserCreation,
    syncUserAccountState,
    healthCheck,
    createSuperAdminInSoftwareManagement
};
