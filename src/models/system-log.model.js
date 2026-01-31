const mongoose = require("mongoose");
const { SYSTEM_LOG_EVENTS, STATUS_TYPES, SERVICE_NAMES } = require("@configs/system-log-events.config");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

const systemLogSchema = new mongoose.Schema({
    // SERVER & SERVICE IDENTITY
    
    // 1. Which service performed the action?
    serviceName: { 
        type: String, 
        required: true, 
        enum: Object.values(SERVICE_NAMES) 
    },

    // 2. Which server instance did this? (hostname:pid for distributed systems)
    serverInstanceId: {
        type: String,
        default: null, // Will be auto-populated if not provided
        index: true
    },

    // 3. Source service in microservice calls (x-service-name header)
    sourceService: {
        type: String,
        default: null, // e.g., "admin-panel-service" calling auth-service
        enum: [null, ...Object.values(SERVICE_NAMES)]
    },

    // 4. Request ID for tracing (x-request-id)
    requestId: {
        type: String,
        default: null
    },

    // EVENT DETAILS
    
    // 5. Event Type (What kind of action?)
    eventType: { 
        type: String, 
        required: true, 
        enum: Object.values(SYSTEM_LOG_EVENTS),
        index: true
    },

    // 6. Action Name (Specific action identifier)
    action: { 
        type: String, 
        required: true,
        index: true
    },

    // 7. Status (Did it succeed?)
    status: { 
        type: String, 
        enum: Object.values(STATUS_TYPES), 
        default: STATUS_TYPES.SUCCESS 
    },

    // 8. Description (Human-readable message)
    description: { 
        type: String,
        required: true
    },

    // TARGET & ACTOR
    
    // 9. Target (What was affected? userId, deviceId, etc.)
    targetId: { 
        type: String, 
        default: null,
        index: true
    },

    // 10. Executor (Who triggered it? userId if user-initiated, null for system/cron)
    executedBy: {
        type: String,
        default: null,
        index: true
    },

    // REQUEST CONTEXT (For HTTP-triggered events)
    
    // 11. IP Address
    ipAddress: {
        type: String,
        default: null
    },

    // 12. User Agent
    userAgent: {
        type: String,
        default: null
    },

    // METADATA
    
    // 13. Additional data (minimal, structured)
    metadata: { 
        type: Object, 
        default: {} 
    }
}, { 
    timestamps: true 
});

// INDEXES FOR PERFORMANCE

// Compound index for service + event type queries
systemLogSchema.index({ serviceName: 1, eventType: 1, createdAt: -1 });

// Server instance tracking
systemLogSchema.index({ serverInstanceId: 1, createdAt: -1 });

// Status-based queries
systemLogSchema.index({ status: 1, createdAt: -1 });

// Request tracing
systemLogSchema.index({ requestId: 1 });

// Time-based queries (most common)
systemLogSchema.index({ createdAt: -1 });

module.exports = {
    SystemLogModel: mongoose.model(DB_COLLECTIONS.SYSTEM_LOG, systemLogSchema)
}