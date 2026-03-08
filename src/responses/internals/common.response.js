const { logWithTime } = require("@utils/time-stamps.util");
const { OK, CREATED } = require("@configs/http-status.config");

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

/**
 * Success Response - Create User/Admin from Admin Panel
 * @param {Object} res - Express response object
 * @param {Object} result - Service result object
 * @param {string} type - User type ("admin" or "user")
 */
const sendCreateUserSuccessResponse = (res, result, type) => {
    logWithTime(`✅ ${type.toUpperCase()} created successfully via Admin Panel: ${result.userId}`);
    return res.status(CREATED).json({
        success: true,
        message: `${type === "admin" ? "Admin" : "User"} created successfully`,
        data: {
            userId: result.userId,
            contactMode: result.contactMode,
            verificationSent: result.verificationSent,
            message: result.message
        },
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    // Health checks
    sendAdminPanelServiceHealthSuccess,
    sendSoftwareServiceHealthSuccess,
    
    // User management
    sendCreateUserSuccessResponse
};
