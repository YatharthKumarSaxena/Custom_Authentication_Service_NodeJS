/**
 * System Log Service
 * 
 * Handles system-level logging for cron jobs, bootstrap, internal API calls,
 * and distributed system tracking.
 */

const { SystemLogModel } = require("@models/system-log.model");
const { SYSTEM_LOG_EVENTS, STATUS_TYPES, SERVICE_NAMES } = require("@configs/system-log-events.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@/responses/common/error-handler.response");
const { getServerInstanceId, extractRequestMetadata } = require("@utils/server-instance.util");

/**
 * Log system events with full context tracking
 * 
 * @param {Object} logData - Log data object
 * @param {string} logData.eventType - Event type from SYSTEM_LOG_EVENTS (REQUIRED)
 * @param {string} logData.action - Action name (REQUIRED)
 * @param {string} logData.description - Description of what happened (REQUIRED)
 * 
 * @param {string} [logData.serviceName] - Service name from SERVICE_NAMES (default: AUTH_SERVICE)
 * @param {string} [logData.status] - Status: SUCCESS, FAILURE, PENDING, WARNING, ERROR
 * @param {string} [logData.targetId] - Target ID (userId, deviceId, etc.)
 * @param {string} [logData.executedBy] - Who triggered it (userId or null for system)
 * 
 * // Microservice & Distributed System Tracking
 * @param {string} [logData.sourceService] - Source service in microservice calls (x-service-name)
 * @param {string} [logData.requestId] - Request ID for tracing (x-request-id)
 * @param {string} [logData.serverInstanceId] - Server instance ID (auto-generated if not provided)
 * 
 * // HTTP Request Context
 * @param {string} [logData.ipAddress] - IP address
 * @param {string} [logData.userAgent] - User agent
 * @param {Object} [logData.req] - Express request object (auto-extracts metadata)
 * 
 * // Additional Data
 * @param {Object} [logData.metadata] - Optional metadata object
 */
const logSystemEvent = async (logData) => {
    try {
        const {
            // Required fields
            eventType,
            action,
            description,

            // Service identity
            serviceName = SERVICE_NAMES.AUTH_SERVICE,
            
            // Status
            status = STATUS_TYPES.SUCCESS,
            
            // Target & Actor
            targetId = null,
            executedBy = null,
            
            // Microservice tracking
            sourceService = null,
            requestId = null,
            serverInstanceId = null,
            
            // HTTP context
            ipAddress = null,
            userAgent = null,
            req = null,
            
            // Metadata
            metadata = {}
        } = logData;

        // Validate required fields
        if (!eventType || !action || !description) {
            logWithTime("⚠️ System Log: Missing required fields (eventType, action, description)");
            return;
        }

        // Auto-extract request metadata if req object provided
        let requestMetadata = {
            ipAddress,
            userAgent,
            requestId,
            sourceService
        };

        if (req) {
            const extracted = extractRequestMetadata(req);
            requestMetadata = {
                ipAddress: ipAddress || extracted.ipAddress,
                userAgent: userAgent || extracted.userAgent,
                requestId: requestId || extracted.requestId,
                sourceService: sourceService || extracted.sourceService
            };
        }

        // Create system log entry
        await SystemLogModel.create({
            // Service identity
            serviceName,
            serverInstanceId: serverInstanceId || getServerInstanceId(),
            sourceService: requestMetadata.sourceService,
            requestId: requestMetadata.requestId,
            
            // Event details
            eventType,
            action,
            status,
            description,
            
            // Target & Actor
            targetId,
            executedBy,
            
            // HTTP context
            ipAddress: requestMetadata.ipAddress,
            userAgent: requestMetadata.userAgent,
            
            // Metadata
            metadata
        });

        logWithTime(`✅ System Log: [${eventType}] ${action} - ${status}`);
        
    } catch (err) {
        // Silent fail - don't break application flow
        logWithTime("⚠️ Failed to create system log entry");
        errorMessage(err);
    }
};

/**
 * Helper for logging cron job execution
 * 
 * @param {string} cronJobName - Name of the cron job
 * @param {Object} result - Result object with deletedCount or other metrics
 * @param {string} details - Additional details
 */
const logCronExecution = async (cronJobName, result, details = "") => {
    await logSystemEvent({
        serviceName: SERVICE_NAMES.SYSTEM,
        eventType: SYSTEM_LOG_EVENTS.CRON_EXECUTION,
        action: cronJobName,
        description: details || `Executed ${cronJobName}`,
        status: STATUS_TYPES.SUCCESS,
        metadata: result
    });
};

/**
 * Helper for logging cron job failures
 * 
 * @param {string} cronJobName - Name of the cron job
 * @param {Error} error - Error object
 */
const logCronFailure = async (cronJobName, error) => {
    await logSystemEvent({
        serviceName: SERVICE_NAMES.SYSTEM,
        eventType: SYSTEM_LOG_EVENTS.CRON_EXECUTION,
        action: cronJobName,
        description: `Failed to execute ${cronJobName}: ${error.message}`,
        status: STATUS_TYPES.FAILURE,
        metadata: { errorStack: error.stack }
    });
};

/**
 * Helper for logging bootstrap admin events
 * 
 * @param {string} action - Action taken (e.g., "ADMIN_CREATED", "ADMIN_EXISTS")
 * @param {string} description - Description of the action
 * @param {string} [adminId] - Optional admin user ID
 */
const logBootstrapEvent = async (action, description, adminId = null) => {
    await logSystemEvent({
        serviceName: SERVICE_NAMES.SYSTEM,
        eventType: SYSTEM_LOG_EVENTS.BOOTSTRAP_ADMIN,
        action,
        description,
        targetId: adminId,
        status: STATUS_TYPES.SUCCESS
    });
};

/**
 * Helper for logging internal API calls between microservices
 * 
 * @param {Object} params - Parameters
 * @param {string} params.sourceService - Calling service
 * @param {string} params.targetService - Target service
 * @param {string} params.action - Action/endpoint called
 * @param {string} params.description - Description
 * @param {string} params.status - Status
 * @param {string} [params.requestId] - Request ID
 * @param {Object} [params.metadata] - Additional metadata
 */
const logInternalApiCall = async (params) => {
    const { sourceService, targetService, action, description, status, requestId = null, metadata = {} } = params;
    
    await logSystemEvent({
        serviceName: targetService || SERVICE_NAMES.AUTH_SERVICE,
        sourceService,
        eventType: SYSTEM_LOG_EVENTS.INTERNAL_API_CALL,
        action,
        description,
        status,
        requestId,
        metadata
    });
};

/**
 * Helper for logging microservice initialization
 * 
 * @param {string} description - Description of initialization
 * @param {Object} metadata - Initialization metadata
 */
const logMicroserviceInit = async (description, metadata = {}) => {
    await logSystemEvent({
        serviceName: SERVICE_NAMES.SYSTEM,
        eventType: SYSTEM_LOG_EVENTS.MICROSERVICE_INIT,
        action: "MICROSERVICE_INITIALIZATION",
        description,
        status: STATUS_TYPES.SUCCESS,
        metadata
    });
};

module.exports = {
    logSystemEvent,
    logCronExecution,
    logCronFailure,
    logBootstrapEvent,
    logInternalApiCall,
    logMicroserviceInit
};
