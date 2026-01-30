/**
 * 🔐 Internal API Routes
 * 
 * Routes for internal service-to-service communication.
 * Protected by service token authentication.
 * Only available when MAKE_IT_MICROSERVICE=true
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const express = require("express");
const internalRouter = express.Router();
const { microserviceConfig } = require("@configs/microservice.config");

// Check if microservice mode is enabled
if (!microserviceConfig.enabled) {
    console.log('ℹ️  Internal routes disabled (monolithic mode)');
    module.exports = { internalRouter };
} else {
    // Load internal modules only in microservice mode
    const internal = require('../internals');
    
    if (!internal) {
        console.error('❌ Internal module not available');
        module.exports = { internalRouter };
    } else {
        const { verifyAnyService } = internal.middlewares;

        // 🏥 Health check endpoint
        internalRouter.get('/health', verifyAnyService, (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Authentication Service is healthy',
                service: 'auth-service',
                timestamp: new Date().toISOString()
            });
        });

        // 🔍 Service token status
        internalRouter.get('/token-status', verifyAnyService, async (req, res) => {
            try {
                const { getTokenStatus } = internal.serviceToken;
                const status = getTokenStatus();

                res.status(200).json({
                    success: true,
                    data: status
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get token status',
                    error: error.message
                });
            }
        });

        console.log('✅ Internal routes enabled (microservice mode)');
        module.exports = { internalRouter };
    }
}
