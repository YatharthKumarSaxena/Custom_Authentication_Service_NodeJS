# 📊 System Log Usage Guide

Complete guide for using the enhanced system logging service with distributed system tracking.

## 🎯 Overview

The system log service now supports:
- **Server Instance Tracking**: Know which server/process handled an operation
- **Microservice Tracing**: Track x-service-name and x-request-id headers
- **HTTP Request Context**: Capture IP, user agent, and request metadata
- **Actor Tracking**: Know who triggered the action (user or system)
- **Enhanced Event Types**: More granular event categorization

---

## 📦 Basic Usage

### Simple System Event

```javascript
const { logSystemEvent } = require('@services/system/system-log.service');
const { SYSTEM_LOG_EVENTS, STATUS_TYPES } = require('@configs/system-log-events.config');

await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.TOKEN_REFRESH,
    action: 'TOKEN_REFRESH_SUCCESS',
    description: 'Successfully refreshed tokens for user'
});
```

### With Target and Metadata

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.TOKEN_REFRESH,
    action: 'TOKEN_REFRESH_SUCCESS',
    description: 'Successfully refreshed tokens for user',
    targetId: userId,
    status: STATUS_TYPES.SUCCESS,
    metadata: {
        deviceUUID: device.deviceUUID,
        tokenVersion: 5
    }
});
```

---

## 🌐 Microservice Context

### With Request Object (Auto-extracts metadata)

```javascript
// In a controller or middleware with access to req object
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.INTERNAL_API_CALL,
    action: 'ADMIN_PANEL_SYNC',
    description: 'Syncing admin identity to admin panel service',
    req: req, // Auto-extracts IP, user-agent, x-request-id, x-service-name
    targetId: adminId
});
```

### Manual Microservice Tracking

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.INTERNAL_API_CALL,
    action: 'SERVICE_TO_SERVICE_CALL',
    description: 'Admin panel service called auth service',
    sourceService: SERVICE_NAMES.ADMIN_PANEL_SERVICE, // x-service-name
    requestId: 'req-abc-123', // x-request-id
    targetId: userId
});
```

---

## 🖥️ Server Instance Tracking

### Automatic Server Instance ID

```javascript
// Server instance ID is automatically added
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.CRON_EXECUTION,
    action: 'CLEANUP_EXPIRED_TOKENS',
    description: 'Cleaned up expired tokens'
});

// Logs will include: serverInstanceId: "server-01:12345" (hostname:pid)
```

### Custom Server Instance

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.SERVICE_STARTUP,
    action: 'SERVICE_INIT',
    description: 'Auth service started',
    serverInstanceId: 'custom-server-id',
    metadata: {
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
    }
});
```

---

## 👤 Actor Tracking

### User-Initiated Actions

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.TOKEN_REFRESH,
    action: 'USER_TOKEN_REFRESH',
    description: 'User manually refreshed their token',
    targetId: userId,
    executedBy: userId, // Who triggered this action
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
});
```

### System-Initiated Actions

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.CRON_EXECUTION,
    action: 'AUTO_CLEANUP',
    description: 'System automatically cleaned up expired sessions',
    executedBy: null, // System action (no user)
    serviceName: SERVICE_NAMES.SYSTEM
});
```

---

## 🚨 Security Events

### Token Reuse Detection

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.TOKEN_REUSE_DETECTED,
    action: 'TOKEN_REUSE_ATTACK',
    description: '🚨 SECURITY ALERT: Token reuse detected',
    status: STATUS_TYPES.ERROR,
    targetId: userId,
    metadata: {
        deviceUUID: device.deviceUUID,
        securityAlert: 'Potential token reuse attack detected'
    }
});
```

### Device Mismatch

```javascript
await logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.DEVICE_MISMATCH,
    action: 'DEVICE_MISMATCH_DETECTED',
    description: 'Device UUID mismatch detected',
    status: STATUS_TYPES.WARNING,
    targetId: userId,
    metadata: {
        tokenDeviceUUID: tokenDevice,
        requestDeviceUUID: requestDevice
    }
});
```

---

## 🔧 Helper Functions

### Cron Job Logging

```javascript
const { logCronExecution, logCronFailure } = require('@services/system/system-log.service');

// Success
await logCronExecution('CLEANUP_EXPIRED_TOKENS', { deletedCount: 15 }, 'Cleaned up 15 expired tokens');

// Failure
await logCronFailure('CLEANUP_EXPIRED_TOKENS', error);
```

### Bootstrap Events

```javascript
const { logBootstrapEvent } = require('@services/system/system-log.service');

await logBootstrapEvent(
    'ADMIN_CREATED',
    'Super Admin created successfully via bootstrap',
    adminId
);
```

### Internal API Calls

```javascript
const { logInternalApiCall } = require('@services/system/system-log.service');

await logInternalApiCall({
    sourceService: SERVICE_NAMES.ADMIN_PANEL_SERVICE,
    targetService: SERVICE_NAMES.AUTH_SERVICE,
    action: 'BOOTSTRAP_ADMIN',
    description: 'Admin panel service called bootstrap admin API',
    status: STATUS_TYPES.SUCCESS,
    requestId: 'req-xyz-789',
    metadata: { adminId }
});
```

---

## 📋 Available Event Types

```javascript
SYSTEM_LOG_EVENTS = {
    // Cron & Scheduled Tasks
    CRON_EXECUTION
    SCHEDULED_TASK
    
    // Bootstrap & Initialization
    BOOTSTRAP_ADMIN
    MICROSERVICE_INIT
    SERVICE_STARTUP
    SERVICE_SHUTDOWN
    
    // Internal API Calls
    INTERNAL_API_CALL
    SERVICE_TO_SERVICE
    
    // Token & Session
    TOKEN_REFRESH
    TOKEN_VERIFICATION_FAILED
    TOKEN_REUSE_DETECTED
    SESSION_CREATED
    SESSION_ROTATED
    SESSION_DELETED
    SESSION_NOT_FOUND
    
    // Redis & Cache
    REDIS_CONNECTION
    REDIS_ERROR
    CACHE_HIT
    CACHE_MISS
    
    // Database
    DB_TRANSACTION_START
    DB_TRANSACTION_COMMIT
    DB_TRANSACTION_ROLLBACK
    DB_MIGRATION
    
    // Security
    DEVICE_MISMATCH
    INVALID_CREDENTIALS
    RATE_LIMIT_EXCEEDED
    SUSPICIOUS_ACTIVITY
    
    // Errors
    SYSTEM_ERROR
    SERVICE_ERROR
    CRITICAL_ERROR
}
```

---

## 🗄️ Database Schema

System logs are stored with the following structure:

```javascript
{
    // Service & Server Identity
    serviceName: "AUTH_SERVICE",
    serverInstanceId: "server-01:12345",
    sourceService: "ADMIN_PANEL_SERVICE",
    requestId: "req-abc-123",
    
    // Event Details
    eventType: "TOKEN_REFRESH",
    action: "TOKEN_REFRESH_SUCCESS",
    status: "SUCCESS",
    description: "Successfully refreshed tokens",
    
    // Target & Actor
    targetId: "user-xyz",
    executedBy: "user-xyz",
    
    // HTTP Context
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    
    // Metadata
    metadata: { deviceUUID: "device-abc", tokenVersion: 5 },
    
    // Timestamps
    createdAt: "2026-01-30T10:30:00Z",
    updatedAt: "2026-01-30T10:30:00Z"
}
```

---

## 🔍 Querying System Logs

### Find logs by server instance

```javascript
const logs = await SystemLogModel.find({
    serverInstanceId: 'server-01:12345'
}).sort({ createdAt: -1 });
```

### Find logs by request ID (trace a request)

```javascript
const logs = await SystemLogModel.find({
    requestId: 'req-abc-123'
}).sort({ createdAt: 1 });
```

### Find security events

```javascript
const securityLogs = await SystemLogModel.find({
    eventType: {
        $in: [
            SYSTEM_LOG_EVENTS.TOKEN_REUSE_DETECTED,
            SYSTEM_LOG_EVENTS.DEVICE_MISMATCH,
            SYSTEM_LOG_EVENTS.SUSPICIOUS_ACTIVITY
        ]
    },
    status: STATUS_TYPES.ERROR
}).sort({ createdAt: -1 });
```

---

## ✅ Best Practices

1. **Always include required fields**: `eventType`, `action`, `description`
2. **Use appropriate status types**: SUCCESS, FAILURE, WARNING, ERROR
3. **Add targetId for user-specific actions**: Helps trace user activity
4. **Include executedBy for user actions**: Know who triggered it
5. **Pass req object when available**: Auto-extracts useful metadata
6. **Use metadata for additional context**: Keep it minimal and structured
7. **Use helper functions**: `logCronExecution`, `logBootstrapEvent`, etc.
8. **Silent failures**: System logs should never break application flow

---

## 🚀 Migration from Old System

### Old Format
```javascript
logSystemEvent({
    event: 'TOKEN_REFRESH',
    severity: 'info',
    details: { userId, action: 'refresh' }
});
```

### New Format
```javascript
logSystemEvent({
    eventType: SYSTEM_LOG_EVENTS.TOKEN_REFRESH,
    action: 'TOKEN_REFRESH_SUCCESS',
    description: 'Successfully refreshed tokens',
    status: STATUS_TYPES.SUCCESS,
    targetId: userId
});
```

---

## 📞 Support

For questions or issues, refer to the system log service implementation:
- **Service**: [src/services/system/system-log.service.js](./system-log.service.js)
- **Model**: [src/models/system-log.model.js](../../models/system-log.model.js)
- **Config**: [src/configs/system-log-events.config.js](../../configs/system-log-events.config.js)
