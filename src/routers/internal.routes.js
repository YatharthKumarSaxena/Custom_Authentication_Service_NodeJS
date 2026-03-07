/**
 * Internal API Routes
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
const {
    sendAdminPanelServiceHealthSuccess,
    sendSoftwareServiceHealthSuccess
} = require("@/responses/internals/common.response");
const { INTERNAL_ROUTES } = require("@configs/uri.config");
const { adminPanelInternalMiddlewares, softwareManagementInternalMiddlewares, baseMiddlewares } = require("./middleware.gateway.routes");
const { authController } = require("@controllers/auth/index");
const { internalControllers } = require("@controllers/internals/index");
const { PROVIDE_HEALTH_CHECK_TO_ADMIN_PANEL_SERVICE, PROVIDE_HEALTH_CHECK_TO_SOFTWARE_SERVICE, POST_REFRESH, CREATE_USER } = INTERNAL_ROUTES;

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
        // ==================== Health Check Routes (Service-Specific) ====================

        /**
         * @route   GET /internal/auth/health
         * @desc    Health check for auth service
         * @access  Internal (auth-service ONLY)
         */
        internalRouter.get(PROVIDE_HEALTH_CHECK_TO_ADMIN_PANEL_SERVICE, adminPanelInternalMiddlewares, (req, res) => {
            return sendAdminPanelServiceHealthSuccess(res, req.serviceAuth);
        });

        /**
         * @route   GET /internal/software/health
         * @desc    Health check for software management service
         * @access  Internal (software-management-service ONLY)
         */
        internalRouter.get(PROVIDE_HEALTH_CHECK_TO_SOFTWARE_SERVICE, softwareManagementInternalMiddlewares, (req, res) => {
            return sendSoftwareServiceHealthSuccess(res, req.serviceAuth);
        });

        // ==================== Token Management Routes ====================

        /**
         * @route   POST /internal/post-refresh
         * @desc    Refresh access token for Admin Panel and Software Management services
         * @access  Internal (All microservices)
         */
        internalRouter.post(POST_REFRESH, baseMiddlewares, authController.postRefresh);

        // ==================== User Management Routes ====================

        /**
         * @route   POST /internal/create-user
         * @desc    Create user or admin from Admin Panel Service
         * @access  Internal (Admin Panel Service ONLY)
         */
        internalRouter.post(CREATE_USER, adminPanelInternalMiddlewares, internalControllers.createUser);

        module.exports = {
            internalRouter
        }
    }
}


