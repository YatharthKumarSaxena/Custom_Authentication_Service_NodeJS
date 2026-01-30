/**
 * 🛡️ Verify Service Token Middleware
 * 
 * Validates x-service-token header for internal API calls.
 * Rejects user JWTs, and refresh tokens.
 * Only accepts valid service tokens.
 * 
 * @author Custom Auth Service Team
 * @date 2026-01-29
 */

const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}

const { verifyServiceToken } = require('../service-token');
const { verifyTokenInDatabase } = require('../service-token/token.store');
const { HEADERS, SERVICE_NAMES } = require('../constants');
const { logWithTime } = require('@/utils/time-stamps.util');
const { FORBIDDEN, INTERNAL_ERROR, UNAUTHORIZED } = require('@/configs/http-status.config');

/**
 * Middleware to verify service token
 * 
 * Usage:
 *   router.post('/internal/admin/bootstrap', verifyServiceToken, controller);
 * 
 * Optional: Specify allowed service names
 *   router.post('/internal/admin/bootstrap', 
 *     verifyServiceToken([SERVICE_NAMES.AUTH_SERVICE]), 
 *     controller
 *   );
 */
const verifyServiceTokenMiddleware = (allowedServices = null) => {
    return async (req, res, next) => {
        try {
            // Extract service token from header
            const serviceToken = req.headers[HEADERS.SERVICE_TOKEN];

            if (!serviceToken) {
                return res.status(UNAUTHORIZED).json({
                    success: false,
                    message: 'Service token required',
                    error: 'MISSING_SERVICE_TOKEN'
                });
            }

            // Verify token signature and structure
            let decoded;
            try {
                decoded = verifyServiceToken(serviceToken);
            } catch (error) {
                return res.status(UNAUTHORIZED).json({
                    success: false,
                    message: 'Invalid service token',
                    error: 'INVALID_SERVICE_TOKEN',
                    details: error.message
                });
            }

            // Ensure it's a service token (not user JWT)
            if (decoded.type !== 'service-token') {
                return res.status(FORBIDDEN).json({
                    success: false,
                    message: 'User tokens are not allowed for internal APIs',
                    error: 'FORBIDDEN_TOKEN_TYPE'
                });
            }

            // Verify token exists in database and is active
            const tokenRecord = await verifyTokenInDatabase(serviceToken);
            
            if (!tokenRecord) {
                return res.status(UNAUTHORIZED).json({
                    success: false,
                    message: 'Service token not found or inactive',
                    error: 'TOKEN_NOT_FOUND'
                });
            }

            // Check if service is allowed
            if (allowedServices && Array.isArray(allowedServices)) {
                if (!allowedServices.includes(decoded.serviceName)) {
                    return res.status(FORBIDDEN).json({
                        success: false,
                        message: `Service '${decoded.serviceName}' is not allowed to access this endpoint`,
                        error: 'SERVICE_NOT_ALLOWED'
                    });
                }
            }

            // Attach service info to request
            req.serviceAuth = {
                serviceName: decoded.serviceName,
                serviceInstanceId: decoded.serviceInstanceId,
                tokenIssuedAt: new Date(decoded.iat * 1000),
                tokenExpiresAt: new Date(decoded.exp * 1000)
            };

            // Log internal API access
            logWithTime(`🔐 Internal API accessed by: ${decoded.serviceName} (${decoded.serviceInstanceId})`);

            next();
        } catch (error) {
            logWithTime(`❌ Service token verification failed: ${error.message}`);
            return res.status(INTERNAL_ERROR).json({
                success: false,
                message: 'Service token verification failed',
                error: 'VERIFICATION_ERROR',
                details: error.message
            });
        }
    };
};

/**
 * Create middleware with specific allowed services
 * @param {Array<string>} allowedServices - List of allowed service names
 * @returns {Function} Express middleware
 */
const createServiceTokenMiddleware = (allowedServices) => {
    return verifyServiceTokenMiddleware(allowedServices);
};

/**
 * Middleware for admin panel service only
 */
const verifyAdminPanelService = verifyServiceTokenMiddleware([SERVICE_NAMES.ADMIN_PANEL_SERVICE]);

/**
 * Middleware for software management service only
 */
const verifySoftwareManagementService = verifyServiceTokenMiddleware([SERVICE_NAMES.SOFTWARE_MANAGEMENT_SERVICE]);

/**
 * Middleware for any internal service
 */
const verifyAnyService = verifyServiceTokenMiddleware();

module.exports = {
    verifyServiceToken: verifyServiceTokenMiddleware,
    createServiceTokenMiddleware,
    verifyAdminPanelService,
    verifySoftwareManagementService,
    verifyAnyService
};
