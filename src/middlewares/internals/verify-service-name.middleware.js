const { service } = require("@/configs/security.config");
const { createVerifyServiceMiddleware } = require("../factory/verify-service.middleware-factory");


// ==================== Pre-configured Service Middlewares ====================

/**
 * Middleware for Auth Service verification
 * Restricts endpoint access to 'auth-service' only
 * 
 * @example
 * router.post("/internal/sync-users", authServiceMiddleware, controller);
 */
const adminPanelServiceMiddleware = createVerifyServiceMiddleware({
  middlewareName: "AdminPanelService",
  expectedServiceName: service.Admin_Panel_Service_Name,
  expectedTokenSecret: service.ADMIN_PANEL_SERVICE_TOKEN_SECRET
});

/**
 * Middleware for Software Management Service verification
 * Restricts endpoint access to 'software-management-service' only
 * 
 * @example
 * router.post("/internal/sync-software", softwareManagementServiceMiddleware, controller);
 */
const softwareManagementServiceMiddleware = createVerifyServiceMiddleware({
  middlewareName: "SoftwareManagementService",
  expectedServiceName: service.Software_Management_Service_Name,
  expectedTokenSecret: service.SOFTWARE_MANAGEMENT_SERVICE_TOKEN_SECRET
});

module.exports = {
  adminPanelServiceMiddleware,
  softwareManagementServiceMiddleware
};