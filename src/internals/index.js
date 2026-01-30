/**
 * 📦 Internal Module - Main Export
 * 
 * This is the main entry point for all internal microservice functionality.
 * When MAKE_IT_MICROSERVICE=false, this entire module returns null,
 * ensuring the application works in monolithic mode without /internal.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('./microservice.guard');

// If microservice mode is disabled, export null
if (!guard) {
    module.exports = null;
} else {
    // Export all internal modules
    module.exports = {
        // Microservice guard
        guard,

        // Constants
        constants: require('./constants'),

        // Service token management
        serviceToken: require('./service-token'),

        // Redis session management
        redisSession: require('./redis-session'),

        // Internal middlewares
        middlewares: require('./middlewares'),

        // Internal API clients
        clients: require('./internal-client'),

        // Utility: Check if microservice mode is enabled
        isMicroserviceMode: () => {
            return process.env.MAKE_IT_MICROSERVICE === 'true';
        }
    };
}
