/**
 * 🔌 Admin Panel Service Client
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
 * @returns {Promise<boolean>} true if service is healthy
 */
const healthCheck = async () => {
    try {
        const client = await createAuthenticatedClient();
        const response = await client.get('/internal/health');
        return response.status === 200;
    } catch (error) {
        logWithTime(`❌ Admin Panel Service health check failed: ${error.message}`);
        return false;
    }
};

module.exports = {
    bootstrapSuperAdmin,
    syncIdentityState,
    syncAccountState,
    rollbackAdminCreation,
    healthCheck
};
