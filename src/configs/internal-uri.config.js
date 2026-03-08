/**
 * Internal Service URI Configuration
 * 
 * Central configuration for all internal microservice API endpoints.
 * Contains URIs and HTTP methods for Auth Service and Software Management Service.
 * 
 * @author Custom Auth Service Team
 * @date 2026-03-06
 */


const requestMethod = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
    PATCH: "PATCH"
}

/**
 * Admin Panel Service Internal API Endpoints
 */
const ADMIN_PANEL_URIS = {
    HEALTH_CHECK: {
        method: requestMethod.GET,
        uri: "/admin-panel-service/api/v1/internal/auth/health"
    },
    CREATE_SUPER_ADMIN: {
        method: requestMethod.POST,
        uri: "/admin-panel-service/api/v1/internal/create-super-admin"
    },
    CREATE_USER: {
        method: requestMethod.POST,
        uri: "/admin-panel-service/api/v1/internal/create-user"
    }
};

/**
 * Software Management Service Internal API Endpoints
 */
const SOFTWARE_MANAGEMENT_URIS = {
    HEALTH_CHECK: {
        method: requestMethod.GET,
        uri: "/software-management-service/api/v1/internal/auth/health"
    },
    CREATE_SUPER_ADMIN: {
        method: requestMethod.POST,
        uri: "/software-management-service/api/v1/internal/create-super-admin"
    }
};

module.exports = {
    ADMIN_PANEL_URIS,
    SOFTWARE_MANAGEMENT_URIS,
    requestMethod
};
