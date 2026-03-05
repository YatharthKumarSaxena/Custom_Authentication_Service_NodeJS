const { logWithTime } = require("@utils/time-stamps.util");
const { OK } = require("@configs/http-status.config");

/**
 * Common Response Handlers for Internal Routes
 * 
 * Centralized response management for internal/microservice communication
 * No hardcoded responses in routes
 */

/**
 * Success Response - Auth Service Health Check
 * @param {Object} res - Express response object
 * @param {Object} serviceAuth - Service authentication data
 */
const sendAdminPanelServiceHealthSuccess = (res, serviceAuth) => {
    logWithTime("✅ Admin panel service health check successful");
    return res.status(OK).json({
        success: true,
        message: "Admin panel service endpoint is healthy",
        service: "admin-panel-service",
        requestedBy: {
            serviceName: serviceAuth.serviceName,
            serviceInstanceId: serviceAuth.serviceInstanceId
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * Success Response - Software Management Service Health Check
 * @param {Object} res - Express response object
 * @param {Object} serviceAuth - Service authentication data
 */
const sendSoftwareServiceHealthSuccess = (res, serviceAuth) => {
    logWithTime("✅ Software management service health check successful");
    return res.status(OK).json({
        success: true,
        message: "Software management service endpoint is healthy",
        service: "software-management-service",
        requestedBy: {
            serviceName: serviceAuth.serviceName,
            serviceInstanceId: serviceAuth.serviceInstanceId
        },
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    // Health checks
    sendAdminPanelServiceHealthSuccess,
    sendSoftwareServiceHealthSuccess
};