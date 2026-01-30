/**
 * 🔧 Service Constants
 * 
 * Central configuration for microservice architecture.
 * These constants define service names, token lifetimes, and operational parameters.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

module.exports = {
    // Service Names
    SERVICE_NAMES: {
        AUTH_SERVICE: 'auth-service',
        ADMIN_PANEL_SERVICE: 'admin-panel-service',
        SOFTWARE_MANAGEMENT_SERVICE: 'software-management-service'
    },

    // Service Token Configuration
    SERVICE_TOKEN: {
        EXPIRY: 60 * 60, // 60 minutes in seconds
        ROTATION_THRESHOLD: 10 * 60, // 10 minutes in seconds
        SECRET: process.env.SERVICE_TOKEN_SECRET,
        ALGORITHM: 'HS256'
    },

    // Redis Configuration
    REDIS: {
        KEY_PREFIX: 'auth:session:',
        SESSION_TTL: 691200,   // 8 days
        KEY_SALT: process.env.REDIS_KEY_SALT || 'default-redis-salt-change-in-production'
    },

    // Internal API Configuration
    INTERNAL_API: {
        ADMIN_PANEL_BASE_URL: process.env.ADMIN_PANEL_SERVICE_URL || 'http://localhost:8081',
        SOFTWARE_MANAGEMENT_BASE_URL: process.env.SOFTWARE_MANAGEMENT_SERVICE_URL || 'http://localhost:8082',
        TIMEOUT: 10000, // 10 seconds // har attempt ka max wait time in ms
        RETRY_ATTEMPTS: 3, 
        RETRY_DELAY: 1000 // 1 second
    },

    // Service Token Header
    HEADERS: {
        SERVICE_TOKEN: 'x-service-token',
        SERVICE_NAME: 'x-service-name',
        REQUEST_ID: 'x-request-id'
    }
};
