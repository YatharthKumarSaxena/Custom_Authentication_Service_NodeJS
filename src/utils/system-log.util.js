const { SystemLogModel } = require("@models/system-log.model");
const { SYSTEM_LOG_EVENTS, STATUS_TYPES, SERVICE_NAMES } = require("@configs/system-log-events.config");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage } = require("@utils/error-handler.util");

/**
 * Log system events (cron jobs, bootstrap, internal API calls)
 * @param {Object} logData - Log data object
 * @param {string} logData.serviceName - Service name from SERVICE_NAMES
 * @param {string} logData.eventType - Event type from SYSTEM_LOG_EVENTS
 * @param {string} logData.action - Action name (e.g., "CLEANUP_AUTH_LOGS")
 * @param {string} logData.description - Description of what happened
 * @param {string} [logData.targetId] - Optional target ID (userID, deviceID, etc.)
 * @param {string} [logData.status] - Status: SUCCESS, FAILURE, PENDING
 * @param {Object} [logData.metadata] - Optional metadata object
 */
const logSystemEvent = async (logData) => {
    try {
        const {
            serviceName = SERVICE_NAMES.AUTH_SERVICE,
            eventType,
            action,
            description,
            targetId = null,
            status = STATUS_TYPES.SUCCESS,
            metadata = {}
        } = logData;

        // Validate required fields
        if (!eventType || !action || !description) {
            logWithTime("⚠️ System Log: Missing required fields (eventType, action, description)");
            return;
        }

        // Create system log entry
        await SystemLogModel.create({
            serviceName,
            eventType,
            action,
            targetId,
            status,
            description,
            metadata
        });

    } catch (err) {
        // Silent fail - don't break application flow
        logWithTime("⚠️ Failed to create system log entry");
        errorMessage(err);
    }
};

/**
 * Helper for logging cron job execution
 * @param {string} cronJobName - Name of the cron job
 * @param {Object} result - Result object with deletedCount or other metrics
 * @param {string} details - Additional details
 */
const logCronExecution = async (cronJobName, result, details = "") => {
    await logSystemEvent({
        eventType: SYSTEM_LOG_EVENTS.CRON_EXECUTION,
        action: cronJobName,
        description: details || `Executed ${cronJobName}`,
        status: STATUS_TYPES.SUCCESS,
        metadata: result
    });
};

/**
 * Helper for logging cron job failures
 * @param {string} cronJobName - Name of the cron job
 * @param {Error} error - Error object
 */
const logCronFailure = async (cronJobName, error) => {
    await logSystemEvent({
        eventType: SYSTEM_LOG_EVENTS.CRON_EXECUTION,
        action: cronJobName,
        description: `Failed to execute ${cronJobName}: ${error.message}`,
        status: STATUS_TYPES.FAILURE,
        metadata: { errorStack: error.stack }
    });
};

/**
 * Helper for logging bootstrap admin events
 * @param {string} action - Action taken (e.g., "ADMIN_CREATED", "ADMIN_EXISTS")
 * @param {string} description - Description of the action
 * @param {string} [adminId] - Optional admin user ID
 */
const logBootstrapEvent = async (action, description, adminId = null) => {
    await logSystemEvent({
        eventType: SYSTEM_LOG_EVENTS.BOOTSTRAP_ADMIN,
        action,
        description,
        targetId: adminId,
        status: STATUS_TYPES.SUCCESS
    });
};

module.exports = {
    logSystemEvent,
    logCronExecution,
    logCronFailure,
    logBootstrapEvent
};
