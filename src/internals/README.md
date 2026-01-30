# 🔧 /internal - Microservice Integration Module

> **WARNING**: This entire module is **OPTIONAL** and only activates when `MAKE_IT_MICROSERVICE=true`. If this folder is deleted, the application continues to work in **monolithic mode** without any issues.

---

## 📋 Overview

The `/internal` module contains all microservice-specific logic for the Custom Authentication Service. It implements:

- **Service-to-service authentication** using JWT-based service tokens
- **Distributed session management** with Redis
- **Internal API clients** for cross-service communication
- **Service token verification middleware** for securing internal endpoints

---

## 🔒 Architecture Principles

### 1. **Folder Boundary**
All microservice logic **MUST** live inside `/internal`. Controllers and core auth logic remain independent.

### 2. **Microservice Guard**
Every file starts with:
```javascript
const guard = require('../microservice.guard');
if (!guard) {
    module.exports = null;
    return;
}
```

This ensures that if `MAKE_IT_MICROSERVICE=false`, the entire module returns `null` without errors.

### 3. **Dual-Mode Execution**
- **Monolithic Mode** (`MAKE_IT_MICROSERVICE=false`):
  - No service tokens
  - No Redis sessions
  - No internal API calls
  - Database is the only source of truth

- **Microservice Mode** (`MAKE_IT_MICROSERVICE=true`):
  - Service tokens for authentication
  - Redis for distributed sessions
  - Internal API clients active
  - Cross-service communication enabled

---

## 📁 Folder Structure

```
internal/
├── microservice.guard.js          # 🛡️ Master guard - disables entire module
├── index.js                        # 📦 Main export point
├── constants/
│   ├── service.constants.js       # 🔧 Service names, token config, URLs
│   └── index.js
├── service-token/
│   ├── token.generator.js         # 🎫 Generate & verify service tokens
│   ├── token.rotator.js           # 🔄 Auto-rotation logic
│   ├── token.store.js             # 💾 Database operations (hashed storage)
│   └── index.js
├── redis-session/
│   ├── redis.key.builder.js       # 🔑 Cryptographic key generation
│   ├── redis.session.manager.js   # 💾 Session CRUD operations
│   └── index.js
├── middlewares/
│   ├── verify-service-token.middleware.js  # 🛡️ Protect internal APIs
│   └── index.js
└── internal-client/
    ├── admin-panel.client.js      # 🔌 Admin Panel Service client
    ├── software-management.client.js  # 🔌 Software Management client
    └── index.js
```

---

## 🎫 Service Token System

### Purpose
Service tokens are **ONLY** for service-to-service communication. They are **NEVER** used for:
- User authentication
- Frontend requests
- Public APIs

### Token Properties
- **Algorithm**: HS256 (JWT)
- **Secret**: `SERVICE_TOKEN_SECRET` (env variable)
- **Payload**:
  ```json
  {
    "serviceName": "auth-service",
    "serviceInstanceId": "hostname-pid-timestamp",
    "type": "service-token",
    "iat": 1234567890,
    "exp": 1234568790
  }
  ```

### Lifecycle
- **Expiry**: 15 minutes
- **Rotation Threshold**: 10 minutes (auto-rotates when < 10 mins remaining)
- **Startup**: Fresh token generated on every service start
- **Storage**: Only **hashed tokens** stored in database (never raw tokens)

### Token Rotation
Automatic rotation happens:
1. When time remaining < 10 minutes
2. Every service startup
3. Manual rotation via `forceRotateToken()`

### Usage
```javascript
const internal = require('../../internal');
const { getServiceToken } = internal.serviceToken;

// Get current token (auto-rotates if needed)
const token = await getServiceToken('auth-service');
```

---

## 🔑 Redis Session Management

### Key Generation
Redis keys are **cryptographically hashed** to prevent discovery:

```javascript
HASH(userId + deviceUUID + REDIS_KEY_SALT) → SHA-256 hash
```

**Example**:
```
Input: "USR001" + "uuid-123" + "salt"
Output: "auth:session:a3f5e8b2c4d1..."
```

### Why Hashing?
If Redis is compromised:
- ❌ Cannot reverse-engineer `userId`
- ❌ Cannot reverse-engineer `deviceUUID`
- ✅ Only Authentication Service can build keys

### Session Structure
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "version": 1,
  "rotatedAt": 1234567890,
  "userId": "USR001",
  "deviceUUID": "uuid-123"
}
```

### Operations
- `storeSession()` - Store new session
- `getSession()` - Retrieve session
- `rotateSession()` - Update with new tokens
- `deleteSession()` - Single device logout
- `deleteAllUserSessions()` - All devices logout

---

## 🔒 Internal API Security

### Middleware: `verifyServiceToken`

Protects internal endpoints from:
- ❌ User JWTs
- ❌ Access tokens
- ❌ Refresh tokens
- ❌ Unauthorized services

### Usage
```javascript
const { verifyAnyService } = require('../../internal').middlewares;

router.post('/internal/admin/bootstrap', 
    verifyAnyService, 
    controller
);
```

### Variants
- `verifyAnyService` - Accept any valid service token
- `verifyAdminPanelService` - Only Admin Panel Service
- `verifySoftwareManagementService` - Only Software Management Service

### Header Required
```
x-service-token: <JWT service token>
```

---

## 🔌 Internal API Clients

### Admin Panel Service Client

**Purpose**: Manage admin identity and state sync.

**Endpoints**:
1. **Bootstrap Super Admin**
   ```javascript
   await adminPanelClient.bootstrapSuperAdmin(adminId);
   ```
   - Called during super admin creation
   - Only sends `adminId` (no personal data)

2. **Identity State Sync**
   ```javascript
   await adminPanelClient.syncIdentityState(adminId, isVerified);
   ```
   - Updates verification status

3. **Account State Sync**
   ```javascript
   await adminPanelClient.syncAccountState(adminId, isBlocked, isActive);
   ```
   - Updates account status

4. **Rollback** (Compensating Transaction)
   ```javascript
   await adminPanelClient.rollbackAdminCreation(adminId);
   ```
   - Called if admin creation fails

### Software Management Service Client

**Purpose**: Notify about user lifecycle events.

**Endpoints**:
1. **User Creation Notification**
   ```javascript
   await softwareManagementClient.notifyUserCreation(userId);
   ```

2. **Account State Sync**
   ```javascript
   await softwareManagementClient.syncUserAccountState(userId, isActive);
   ```

### Retry Logic
- **Attempts**: 3
- **Delay**: 1 second between retries
- **Timeout**: 10 seconds per request

---

## 📡 Post-Refresh API

### Purpose
Centralized token refresh for microservices. Replaces centralized token service pattern.

### Endpoint
```
POST /custom-auth-service/api/v1/auth/post-refresh
```

### Request
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Response
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900,
    "tokenVersion": 2
  }
}
```

### Flow
1. Verify refresh token (signature + expiry)
2. Validate device match
3. Generate new tokens
4. Update database
5. Update Redis session (microservice mode)
6. Return new tokens

---

## ⚙️ Environment Configuration

### Required Variables

```env
# Microservice Mode
MAKE_IT_MICROSERVICE=false

# Service Token
SERVICE_TOKEN_SECRET=your_secret_here
SERVICE_INSTANCE_NAME=auth-service-01

# Redis Session
REDIS_KEY_SALT=your_salt_here

# Internal Service URLs
ADMIN_PANEL_SERVICE_URL=http://localhost:8081
SOFTWARE_MANAGEMENT_SERVICE_URL=http://localhost:8082
```

### Validation
Configuration is validated on startup:
```javascript
const { logMicroserviceStatus } = require('@configs/microservice.config');
logMicroserviceStatus();
```

---

## 🚀 Initialization

### Startup Sequence
1. **Database Connection** (MongoDB)
2. **Super Admin Bootstrap**
3. **Microservice Initialization** (if enabled):
   - Generate service token
   - Test Redis connection
   - Log internal service URLs
   - Setup token rotation scheduler
4. **Start Server**

### Token Rotation Scheduler
Runs every 5 minutes to check and rotate tokens:
```javascript
setupTokenRotationScheduler();
```

---

## 🧪 Testing Microservice Mode

### Enable Microservice Mode
```bash
export MAKE_IT_MICROSERVICE=true
export SERVICE_TOKEN_SECRET=test-secret
export REDIS_KEY_SALT=test-salt
```

### Disable (Monolithic Mode)
```bash
export MAKE_IT_MICROSERVICE=false
```

### Delete /internal Folder Test
```bash
rm -rf src/internal
npm start  # Should work without errors
```

---

## 🛡️ Security Best Practices

### ✅ DO
- Hash service tokens before database storage
- Use cryptographic salts for Redis keys
- Rotate tokens regularly
- Validate service identity on every internal call
- Use compensating transactions for failures

### ❌ DON'T
- Store raw service tokens in database
- Use user JWTs for internal APIs
- Duplicate contact info across services
- Hardcode service URLs in code
- Skip retry logic for internal calls

---

## 📊 Monitoring

### Token Status
```javascript
const { getTokenStatus } = internal.serviceToken;
const status = getTokenStatus();

console.log(status);
// {
//   serviceName: 'auth-service',
//   expiresAt: Date,
//   timeRemaining: 600,
//   needsRotation: false,
//   status: 'active'
// }
```

### Redis Session Stats
```javascript
const devices = await redisSession.getUserDevices(userId);
console.log(`Active devices: ${devices.length}`);
```

---

## 🔥 Production Checklist

- [ ] Set `SERVICE_TOKEN_SECRET` to strong random value
- [ ] Set `REDIS_KEY_SALT` to unique value
- [ ] Configure actual internal service URLs
- [ ] Enable Redis persistence
- [ ] Setup monitoring for token rotation
- [ ] Configure proper network security between services
- [ ] Test rollback scenarios
- [ ] Monitor internal API latency

---

## 📝 Notes

1. **Database is Source of Truth**: Redis failures don't break authentication
2. **No Tight Coupling**: Services can be stopped/started independently
3. **Graceful Degradation**: Redis unavailable? Falls back to database
4. **Identity Separation**: Never duplicate contact info
5. **Compensating Transactions**: Always implement rollback logic

---

## 🤝 Contributing

When adding new internal functionality:
1. Add microservice guard at the top
2. Return `null` if guard fails
3. Export from appropriate `index.js`
4. Update this README
5. Test in both modes

---

**Built with ❤️ by Custom Auth Service Team**
