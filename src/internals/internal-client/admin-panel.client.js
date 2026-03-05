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

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getServiceToken } = require('../service-token');
const { INTERNAL_API, HEADERS, SERVICE_NAMES } = require('../constants');
const { logWithTime } = require('@/utils/time-stamps.util');
const { OK, CREATED } = require('@/configs/http-status.config');

// Device configuration
const DEVICE_UUID = process.env.DEVICE_UUID || '00000000-0000-4000-8000-000000000000';
const DEVICE_TYPE = process.env.DEVICE_TYPE || 'SERVER';

/**
 * Create axios instance with service authentication
 */
const createAuthenticatedClient = async () => {
    const serviceToken = await getServiceToken(SERVICE_NAMES.AUTH_SERVICE);

    return axios.create({
        baseURL: INTERNAL_API.ADMIN_PANEL_BASE_URL,
        timeout: INTERNAL_API.TIMEOUT,
        headers: {
            [HEADERS.SERVICE_TOKEN]: serviceToken,
            [HEADERS.SERVICE_NAME]: SERVICE_NAMES.AUTH_SERVICE,
            [HEADERS.REQUEST_ID]: uuidv4(),
            [HEADERS.DEVICE_UUID]: DEVICE_UUID,
            [HEADERS.DEVICE_TYPE]: DEVICE_TYPE,
            'Content-Type': 'application/json'
        }
    });
};

/**
 * Retry logic for failed requests
 */
const retryRequest = async (requestFn, retries = INTERNAL_API.RETRY_ATTEMPTS) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            if (attempt === retries) {
                throw error;
            }
            
            logWithTime(`⚠️  Request failed (attempt ${attempt}/${retries}). Retrying in ${INTERNAL_API.RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, INTERNAL_API.RETRY_DELAY));
        }
    }
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

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.post('/internal/admin/bootstrap', {
                adminId
            });
        });

        logWithTime(`✅ Super admin bootstrapped successfully`);
        return response.data;
    } catch (error) {
        logWithTime(`❌ Failed to bootstrap super admin: ${error.message}`);
        
        // Handle specific error cases
        if (error.response) {
            throw new Error(
                `Admin Panel Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            throw new Error('Admin Panel Service is not reachable');
        } else {
            throw error;
        }
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

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.patch('/internal/admin/identity-sync', {
                adminId,
                isVerified
            });
        });

        logWithTime(`✅ Identity state synced successfully`);
        return response.data;
    } catch (error) {
        logWithTime(`❌ Failed to sync identity state: ${error.message}`);
        
        if (error.response) {
            throw new Error(
                `Admin Panel Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            throw new Error('Admin Panel Service is not reachable');
        } else {
            throw error;
        }
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

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.patch('/internal/admin/account-state', {
                adminId,
                isBlocked,
                isActive
            });
        });

        logWithTime(`✅ Account state synced successfully`);
        return response.data;
    } catch (error) {
        logWithTime(`❌ Failed to sync account state: ${error.message}`);
        
        if (error.response) {
            throw new Error(
                `Admin Panel Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            throw new Error('Admin Panel Service is not reachable');
        } else {
            throw error;
        }
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

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.delete(`/internal/admin/${adminId}/rollback`);
        });

        logWithTime(`✅ Admin creation rolled back successfully`);
        return response.data;
    } catch (error) {
        logWithTime(`❌ Failed to rollback admin creation: ${error.message}`);
        
        // Rollback failures are critical - log extensively
        logWithTime('⚠️  CRITICAL: Manual intervention may be required');
        logWithTime(`Admin ID: ${adminId}`);
        
        if (error.response) {
            throw new Error(
                `Admin Panel Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            throw new Error('Admin Panel Service is not reachable');
        } else {
            throw error;
        }
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
        
        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.get('/admin-panel-service/api/v1/internal/auth/health');
        });

        const isLive = response.status === 200 && response.data?.success === true;
        
        if (isLive) {
            logWithTime('✅ Admin Panel is live');
        } else {
            logWithTime('⚠️  Admin Panel responded but status is not healthy');
        }
        
        return {
            success: isLive,
            data: response.data || null
        };
    } catch (error) {
        logWithTime(`❌ Admin Panel Service is not reachable: ${error.message}`);
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

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.post('/admin-panel-service/api/v1/internal/create-super-admin', adminData);
        });

        const success = response.status === OK || response.status === CREATED;
        
        if (success && response.data?.success) {
            logWithTime(`✅ Super admin created successfully in Admin Panel Service`);
        } else {
            logWithTime(`⚠️  Unexpected response from Admin Panel Service`);
        }
        
        return {
            success: success && (response.data?.success === true),
            data: response.data || null
        };
    } catch (error) {
        logWithTime(`❌ Failed to create super admin in Admin Panel Service: ${error.message}`);
        
        if (error.response) {
            return {
                success: false,
                error: `Admin Panel Service error: ${error.response.status}`,
                details: error.response.data
            };
        } else if (error.request) {
            return {
                success: false,
                error: 'Admin Panel Service is not reachable'
            };
        } else {
            return {
                success: false,
                error: error.message
            };
        }
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