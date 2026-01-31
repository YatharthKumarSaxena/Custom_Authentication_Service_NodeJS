/**
 * Microservice Initializer
 * 
 * Initializes microservice-specific components on application startup.
 * Only runs when MAKE_IT_MICROSERVICE=true
 * 
 */

const { microserviceConfig, logMicroserviceStatus } = require('@configs/microservice.config');
const { logWithTime } = require('@utils/time-stamps.util');

/**
 * Initialize microservice components
 */
const initializeMicroservice = async () => {
    try {
        // Log microservice status
        const validation = logMicroserviceStatus();

        if (!microserviceConfig.enabled) {
            logWithTime('ℹ️  Microservice mode is disabled');
            return { success: true, mode: 'monolithic' };
        }

        // Validate configuration
        if (!validation.valid) {
            logWithTime('❌ Microservice configuration validation failed');
            validation.errors.forEach(error => logWithTime(`   - ${error}`));
            throw new Error('Invalid microservice configuration');
        }

        logWithTime('🔧 Initializing microservice components...');

        // Load internal modules
        const internal = require('@internals');

        if (!internal) {
            throw new Error('Internal module not available');
        }

        // Initialize service token
        const { initializeServiceToken, getTokenStatus } = internal.serviceToken;
        const { SERVICE_NAMES } = internal.constants;

        logWithTime('🔐 Generating service token...');
        await initializeServiceToken(SERVICE_NAMES.AUTH_SERVICE);

        const tokenStatus = getTokenStatus();
        logWithTime(`✅ Service token initialized (expires in ${tokenStatus.timeRemaining}s)`);

        // Test Redis connection (if enabled)
        try {
            const { getRedisClient } = require('@utils/redis-client.util');
            const redisClient = getRedisClient();
            await redisClient.ping();
            logWithTime('✅ Redis session management initialized');
        } catch (redisError) {
            logWithTime('⚠️  Redis connection failed - session management may not work');
            logWithTime(`   Error: ${redisError.message}`);
        }

        // Log internal service URLs
        logWithTime(`📡 Internal Services:`);
        logWithTime(`   - Admin Panel: ${microserviceConfig.services.adminPanel}`);
        logWithTime(`   - Software Management: ${microserviceConfig.services.softwareManagement}`);

        logWithTime('✅ Microservice initialization completed');

        return { success: true, mode: 'microservice' };
    } catch (error) {
        logWithTime('❌ Microservice initialization failed');
        logWithTime(`   Error: ${error.message}`);
        throw error;
    }
};

/**
 * Setup token rotation scheduler
 * Runs every 5 minutes to check if token needs rotation
 */
const setupTokenRotationScheduler = () => {
    if (!microserviceConfig.enabled) {
        return;
    }

    try {
        const internal = require('@internals');
        if (!internal) return;

        const { getTokenStatus, rotateServiceToken } = internal.serviceToken;
        const { SERVICE_NAMES } = internal.constants;

        setInterval(async () => {
            try {
                const status = getTokenStatus();
                if (status && status.needsRotation) {
                    logWithTime('🔄 Service token rotation threshold reached, rotating...');
                    await rotateServiceToken(SERVICE_NAMES.AUTH_SERVICE);
                }
            } catch (error) {
                logWithTime(`❌ Token rotation check failed: ${error.message}`);
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        logWithTime('⏰ Token rotation scheduler started');
    } catch (error) {
        logWithTime(`⚠️  Failed to setup token rotation scheduler: ${error.message}`);
    }
};

module.exports = {
    initializeMicroservice,
    setupTokenRotationScheduler
};
