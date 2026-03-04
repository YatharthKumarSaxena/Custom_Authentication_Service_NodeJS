/**
 * Service Constants
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

const { service } = require('@/configs/security.config');

module.exports = {
    // Service Names
    SERVICE_NAMES: {
        AUTH_SERVICE: service.Custom_Auth_Service_Name,
        ADMIN_PANEL_SERVICE: service.Admin_Panel_Service_Name,
        SOFTWARE_MANAGEMENT_SERVICE: service.Software_Management_Service_Name
    },

    // Service Token Configuration
    SERVICE_TOKEN: {
        EXPIRY: 60 * 60, // 60 minutes in seconds
        ROTATION_THRESHOLD: 10 * 60, // 10 minutes in seconds
        SECRET: service.CUSTOM_AUTH_SERVICE_TOKEN_SECRET,
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
        REQUEST_ID: 'x-request-id',
        DEVICE_UUID: 'x-device-uuid',
        DEVICE_TYPE: 'x-device-type'
    }
};
