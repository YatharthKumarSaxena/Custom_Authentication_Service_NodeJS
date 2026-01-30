/**
 * ⚙️ Microservice Configuration
 * 
 * Central configuration for microservice mode settings.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const microserviceConfig = {
    // Is microservice mode enabled?
    enabled: process.env.MAKE_IT_MICROSERVICE === 'true',

    // Service token settings
    serviceToken: {
        secret: process.env.SERVICE_TOKEN_SECRET,
        expiry: 15 * 60, // 15 minutes
        rotationThreshold: 10 * 60 // 10 minutes
    },

    // Service instance name
    instanceName: process.env.SERVICE_INSTANCE_NAME || 'auth-service-default',

    // Redis session settings
    redis: {
        keySalt: process.env.REDIS_KEY_SALT || 'default-salt-change-in-production',
        sessionTTL: 7 * 24 * 60 * 60 // 7 days
    },

    // Internal service URLs
    services: {
        adminPanel: process.env.ADMIN_PANEL_SERVICE_URL || 'http://localhost:8081',
        softwareManagement: process.env.SOFTWARE_MANAGEMENT_SERVICE_URL || 'http://localhost:8082'
    },

    // Internal API settings
    internalApi: {
        timeout: 10000, // 10 seconds
        retryAttempts: 3,
        retryDelay: 1000 // 1 second
    }
};

/**
 * Validate microservice configuration
 */
const validateMicroserviceConfig = () => {
    if (!microserviceConfig.enabled) {
        return { valid: true, mode: 'monolithic' };
    }

    const errors = [];

    if (!microserviceConfig.serviceToken.secret) {
        errors.push('SERVICE_TOKEN_SECRET is required when MAKE_IT_MICROSERVICE=true');
    }

    if (!microserviceConfig.redis.keySalt || microserviceConfig.redis.keySalt === 'default-salt-change-in-production') {
        errors.push('REDIS_KEY_SALT must be set to a secure value in production');
    }

    if (errors.length > 0) {
        return { valid: false, errors, mode: 'microservice' };
    }

    return { valid: true, mode: 'microservice' };
};

/**
 * Log microservice configuration status
 */
const logMicroserviceStatus = () => {
    const validation = validateMicroserviceConfig();

    if (validation.mode === 'monolithic') {
        console.log('🏢 Running in MONOLITHIC mode');
        console.log('   - No Redis session management');
        console.log('   - No service-to-service communication');
        console.log('   - No service tokens');
    } else {
        console.log('🔧 Running in MICROSERVICE mode');
        console.log(`   - Service Instance: ${microserviceConfig.instanceName}`);
        console.log(`   - Admin Panel Service: ${microserviceConfig.services.adminPanel}`);
        console.log(`   - Software Management Service: ${microserviceConfig.services.softwareManagement}`);
        
        if (!validation.valid) {
            console.error('❌ Microservice configuration errors:');
            validation.errors.forEach(error => console.error(`   - ${error}`));
        } else {
            console.log('✅ Microservice configuration valid');
        }
    }

    return validation;
};

module.exports = {
    microserviceConfig,
    validateMicroserviceConfig,
    logMicroserviceStatus
};
