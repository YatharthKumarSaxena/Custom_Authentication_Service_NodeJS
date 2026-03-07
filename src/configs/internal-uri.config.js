/**
 * Internal Service URI Configuration
 * 
 * Central configuration for all internal microservice API endpoints.
 * Contains URIs and HTTP methods for Auth Service and Software Management Service.
 * 
 * @author Custom Auth Service Team
 * @date 2026-03-06
 */

/**
 * Admin Panel Service Internal API Endpoints
 */
const ADMIN_PANEL_URIS = {
    HEALTH_CHECK: {
        method: "GET",
        uri: "/admin-panel-service/api/v1/internal/auth/health"
    },
    CREATE_SUPER_ADMIN: {
        method: "POST",
        uri: "/admin-panel-service/api/v1/internal/create-super-admin"
    }
};

/**
 * Software Management Service Internal API Endpoints
 */
const SOFTWARE_MANAGEMENT_URIS = {
    HEALTH_CHECK: {
        method: "GET",
        uri: "/software-management-service/api/v1/internal/auth/health"
    },
    CREATE_SUPER_ADMIN: {
        method: "POST",
        uri: "/software-management-service/api/v1/internal/create-super-admin"
    }
};

const requestMethod = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
    PATCH: "PATCH"
}

module.exports = {
    ADMIN_PANEL_URIS,
    SOFTWARE_MANAGEMENT_URIS,
    requestMethod
};
