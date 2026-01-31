/**
 * Server Instance Utility
 * 
 * Provides server instance identification for distributed system tracking.
 * Helps identify which server/process handled a particular operation.
 */

const os = require('os');

// Cache the server instance ID
let cachedServerInstanceId = null;

/**
 * Get unique server instance identifier
 * Format: hostname:pid
 * 
 * @returns {string} Server instance ID (e.g., "server-01:12345")
 */
const getServerInstanceId = () => {
    if (cachedServerInstanceId) {
        return cachedServerInstanceId;
    }

    const hostname = os.hostname();
    const pid = process.pid;
    
    cachedServerInstanceId = `${hostname}:${pid}`;
    return cachedServerInstanceId;
};

/**
 * Get detailed server instance information
 * 
 * @returns {Object} Server instance details
 */
const getServerInstanceInfo = () => {
    return {
        instanceId: getServerInstanceId(),
        hostname: os.hostname(),
        pid: process.pid,
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: process.memoryUsage()
        }
    };
};

/**
 * Extract request metadata for logging
 * Useful for HTTP request context in system logs
 * 
 * @param {Object} req - Express request object
 * @returns {Object} Request metadata
 */
const extractRequestMetadata = (req) => {
    if (!req) {
        return {
            ipAddress: null,
            userAgent: null,
            requestId: null,
            sourceService: null
        };
    }

    return {
        ipAddress: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.get('user-agent') || null,
        requestId: req.get('x-request-id') || null,
        sourceService: req.get('x-service-name') || null
    };
};

module.exports = {
    getServerInstanceId,
    getServerInstanceInfo,
    extractRequestMetadata
};
