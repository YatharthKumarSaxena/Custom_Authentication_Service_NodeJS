/**
 * 🔌 Software Management Service Client
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

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getServiceToken } = require('../service-token');
const { INTERNAL_API, HEADERS, SERVICE_NAMES } = require('../constants');

/**
 * Create axios instance with service authentication
 */
const createAuthenticatedClient = async () => {
    const serviceToken = await getServiceToken(SERVICE_NAMES.AUTH_SERVICE);

    return axios.create({
        baseURL: INTERNAL_API.SOFTWARE_MANAGEMENT_BASE_URL,
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
 * Notify Software Management Service about user creation
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Response from Software Management Service
 */
const notifyUserCreation = async (userId) => {
    try {
        logWithTime(`📢 Notifying Software Management Service about user creation: ${userId.substring(0, 8)}...`);

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.post('/internal/users/created', {
                userId
            });
        });

        logWithTime(`✅ User creation notification sent successfully`);
        return response.data;
    } catch (error) {
        logWithTime(`❌ Failed to notify user creation: ${error.message}`);
        
        if (error.response) {
            throw new Error(
                `Software Management Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            throw new Error('Software Management Service is not reachable');
        } else {
            throw error;
        }
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

        const response = await retryRequest(async () => {
            const client = await createAuthenticatedClient();
            return await client.patch('/internal/users/account-state', {
                userId,
                isActive
            });
        });

        logWithTime(`✅ User account state synced successfully`);
        return response.data;
    } catch (error) {
        logWithTime(`❌ Failed to sync user account state: ${error.message}`);
        
        if (error.response) {
            throw new Error(
                `Software Management Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
            );
        } else if (error.request) {
            throw new Error('Software Management Service is not reachable');
        } else {
            throw error;
        }
    }
};

/**
 * Health check for Software Management Service
 * 
 * @returns {Promise<boolean>} true if service is healthy
 */
const healthCheck = async () => {
    try {
        const client = await createAuthenticatedClient();
        const response = await client.get('/internal/health');
        return response.status === 200;
    } catch (error) {
        logWithTime(`❌ Software Management Service health check failed: ${error.message}`);
        return false;
    }
};

module.exports = {
    notifyUserCreation,
    syncUserAccountState,
    healthCheck
};
