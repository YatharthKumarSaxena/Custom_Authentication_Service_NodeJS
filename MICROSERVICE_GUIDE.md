# 🏗️ Microservice Integration Guide

## Custom Authentication Service - Dual-Mode Architecture

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dual-Mode Execution](#dual-mode-execution)
4. [Service Token System](#service-token-system)
5. [Redis Session Management](#redis-session-management)
6. [Internal API Communication](#internal-api-communication)
7. [Post-Refresh Flow](#post-refresh-flow)
8. [Admin Panel Integration](#admin-panel-integration)
9. [Setup Instructions](#setup-instructions)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## 📖 Overview

This Custom Authentication Service supports **two execution modes**:

### Monolithic Mode (`MAKE_IT_MICROSERVICE=false`)
- Traditional single-service architecture
- No service-to-service communication
- No Redis dependency
- Database as single source of truth
- Simpler deployment

### Microservice Mode (`MAKE_IT_MICROSERVICE=true`)
- Distributed architecture
- Service-to-service authentication
- Redis-backed distributed sessions
- Internal API communication
- Production-grade scalability

**Key Feature**: The entire `/internal` folder can be deleted, and the application will continue to work in monolithic mode without modifications.

---

## 🏛️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Service                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │          Core (Always Active)                            ││
│  │  - User Authentication                                   ││
│  │  - Token Generation                                      ││
│  │  - Password Management                                   ││
│  │  - Account Verification                                  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │      /internal (Microservice Mode Only)                  ││
│  │  - Service Tokens                                        ││
│  │  - Redis Sessions                                        ││
│  │  - Internal API Clients                                  ││
│  │  - Service Token Middleware                              ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
              │                           │
              │ Service Token             │ Service Token
              ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │  Admin Panel     │        │   Software       │
    │    Service       │        │  Management      │
    │                  │        │    Service       │
    └──────────────────┘        └──────────────────┘
```

### Data Flow

#### Monolithic Mode
```
User Request → Auth Service → MongoDB → Response
```

#### Microservice Mode
```
User Request → Auth Service → MongoDB + Redis
                    │
                    ├─→ Admin Panel Service (internal APIs)
                    └─→ Software Management Service (internal APIs)
```

---

## 🔄 Dual-Mode Execution

### Mode Selection

Set in `.env` file:
```env
MAKE_IT_MICROSERVICE=false   # Monolithic
MAKE_IT_MICROSERVICE=true    # Microservice
```

### Mode Comparison

| Feature | Monolithic | Microservice |
|---------|-----------|--------------|
| Service Tokens | ❌ Disabled | ✅ Enabled |
| Redis Sessions | ❌ Not Used | ✅ Required |
| Internal APIs | ❌ Inactive | ✅ Active |
| Cross-Service Calls | ❌ None | ✅ HTTP/REST |
| Admin Bootstrap | 🔵 Local | 🟢 Distributed |
| Session Storage | 💾 DB Only | 💾 DB + Redis |
| Deployment Complexity | 🟢 Simple | 🔴 Complex |
| Scalability | 🟡 Moderate | 🟢 High |

### Switching Modes

**To Monolithic**:
```bash
# Update .env
MAKE_IT_MICROSERVICE=false

# Restart service
npm restart

# Optional: Remove /internal folder
rm -rf src/internal
```

**To Microservice**:
```bash
# Update .env
MAKE_IT_MICROSERVICE=true
SERVICE_TOKEN_SECRET=<strong-secret>
REDIS_KEY_SALT=<unique-salt>
ADMIN_PANEL_SERVICE_URL=http://localhost:8081
SOFTWARE_MANAGEMENT_SERVICE_URL=http://localhost:8082

# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Restart service
npm restart
```

---

## 🎫 Service Token System

### Purpose
Service tokens authenticate service-to-service communication. They are **NEVER** used for user authentication.

### Token Structure

```json
{
  "serviceName": "auth-service",
  "serviceInstanceId": "hostname-12345-1737276800000",
  "type": "service-token",
  "iat": 1737276800,
  "exp": 1737277700
}
```

### Token Lifecycle

```
Generation → Active (15 min) → Rotation Threshold (10 min) → Auto-Rotate → Expired
```

### Automatic Rotation

Triggers when:
- Time remaining < 10 minutes
- Every service startup
- Manual rotation requested

### Storage

**Database Schema**:
```javascript
{
  serviceName: String,
  serviceInstanceId: String,
  tokenHash: String,        // SHA-256 hash (never raw token)
  expiresAt: Date,
  rotatedAt: Date,
  isActive: Boolean,
  metadata: {
    generatedBy: String,
    rotationCount: Number
  }
}
```

**Security**:
- ✅ Only hashed tokens stored
- ✅ Raw tokens kept in memory only
- ✅ Automatic cleanup of expired tokens

### Usage Example

```javascript
// Internal client code
const internal = require('../../internal');
const { getServiceToken } = internal.serviceToken;

// Get current token (auto-rotates if needed)
const token = await getServiceToken('auth-service');

// Use in API call
const response = await axios.post(url, data, {
  headers: {
    'x-service-token': token,
    'x-service-name': 'auth-service'
  }
});
```

---

## 🔑 Redis Session Management

### Why Redis?

In microservice architecture:
- Multiple service instances
- Distributed session state
- Fast token lookup
- Automatic expiration

### Key Generation

**Problem**: Storing `userId` and `deviceUUID` directly exposes user data.

**Solution**: Cryptographic hashing

```javascript
key = SHA256(userId + deviceUUID + REDIS_KEY_SALT)
```

**Example**:
```
Input:  "USR001" + "uuid-abc-123" + "production-salt-2026"
Output: "auth:session:7f3e9a2c8d1b5e4f6a8c3d2e5b1f9a7c..."
```

**Benefits**:
- ❌ Cannot reverse-engineer userId
- ❌ Cannot reverse-engineer deviceUUID
- ✅ Only Auth Service can build keys
- ✅ Redis compromise doesn't expose identity

### Session Structure

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "version": 1,
  "rotatedAt": 1737276800000,
  "userId": "USR001",
  "deviceUUID": "uuid-abc-123"
}
```

### Operations

**Store Session** (Login):
```javascript
await storeSession({
  userId: 'USR001',
  deviceUUID: 'uuid-123',
  accessToken: '...',
  refreshToken: '...'
});
```

**Rotate Session** (Token Refresh):
```javascript
await rotateSession({
  userId: 'USR001',
  deviceUUID: 'uuid-123',
  accessToken: '<new-token>',
  refreshToken: '<new-token>'
});
```

**Delete Session** (Logout):
```javascript
await deleteSession('USR001', 'uuid-123');
```

**Delete All Sessions** (Logout All Devices):
```javascript
await deleteAllUserSessions('USR001');
```

### Redis Key Family

Track all devices for a user:
```
auth:session:family:USR001 → Set { "uuid-123", "uuid-456", "uuid-789" }
```

### TTL Management

- **Default TTL**: 7 days (matches refresh token expiry)
- **Auto-Cleanup**: Redis automatically deletes expired keys
- **Manual Cleanup**: On logout

---

## 🔌 Internal API Communication

### Admin Panel Service Integration

#### 1. Bootstrap Super Admin

**Purpose**: Create super admin identity in Admin Panel Service

**Endpoint**: `POST /internal/admin/bootstrap`

**Request**:
```json
{
  "adminId": "USR001"
}
```

**Headers**:
```
x-service-token: <service-jwt>
x-service-name: auth-service
```

**Usage**:
```javascript
const { adminPanelClient } = require('../../internal').clients;

await adminPanelClient.bootstrapSuperAdmin('USR001');
```

**Rules**:
- Only `adminId` sent (no email, phone, name)
- Called during super admin creation
- Admin Panel Service owns role/permission data

#### 2. Identity State Sync

**Purpose**: Update verification status

**Endpoint**: `PATCH /internal/admin/identity-sync`

**Request**:
```json
{
  "adminId": "USR001",
  "isVerified": true
}
```

**Usage**:
```javascript
await adminPanelClient.syncIdentityState('USR001', true);
```

#### 3. Account State Sync

**Purpose**: Update account status (blocked/active)

**Endpoint**: `PATCH /internal/admin/account-state`

**Request**:
```json
{
  "adminId": "USR001",
  "isBlocked": false,
  "isActive": true
}
```

**Usage**:
```javascript
await adminPanelClient.syncAccountState('USR001', false, true);
```

#### 4. Rollback (Compensating Transaction)

**Purpose**: Delete admin if creation fails

**Endpoint**: `DELETE /internal/admin/:adminId/rollback`

**Usage**:
```javascript
try {
  await createAdminInAuthService();
  await adminPanelClient.bootstrapSuperAdmin(adminId);
} catch (error) {
  // Rollback in Auth Service
  await deleteAdminFromAuthService(adminId);
}
```

### Software Management Service Integration

#### 1. User Creation Notification

**Endpoint**: `POST /internal/users/created`

**Request**:
```json
{
  "userId": "USR001"
}
```

#### 2. Account State Sync

**Endpoint**: `PATCH /internal/users/account-state`

**Request**:
```json
{
  "userId": "USR001",
  "isActive": true
}
```

### Retry Logic

All internal calls use automatic retry:

```javascript
Attempt 1 → Fail → Wait 1s →
Attempt 2 → Fail → Wait 1s →
Attempt 3 → Fail → Throw Error
```

**Configuration**:
- **Attempts**: 3
- **Delay**: 1 second
- **Timeout**: 10 seconds per attempt

---

## 🔄 Post-Refresh Flow

### Purpose
Distributed token refresh for microservices. Replaces centralized token service pattern.

### Endpoint

```
POST /custom-auth-service/api/v1/auth/post-refresh
```

### Flow Diagram

```
Client
  │
  │ (1) POST /auth/post-refresh
  │     { refreshToken: "..." }
  ▼
Auth Service
  │
  ├─(2) Verify Refresh Token (JWT signature, expiry)
  │
  ├─(3) Validate Device Match
  │
  ├─(4) Generate New Tokens
  │     - New Access Token
  │     - New Refresh Token
  │
  ├─(5) Update Database
  │     - UserDevice.refreshToken
  │     - UserDevice.accessToken
  │     - lastRefreshedAt
  │
  ├─(6) Update Redis Session (Microservice Mode)
  │     - Rotate session
  │     - Increment version
  │
  └─(7) Return New Tokens
        {
          accessToken: "...",
          refreshToken: "...",
          expiresIn: 900,
          tokenVersion: 2
        }
```

### Implementation

**Controller** (`src/controllers/auth/post-refresh.controller.js`):
```javascript
const { postRefresh } = require('./post-refresh.controller');
router.post('/post-refresh', postRefresh);
```

**Service** (`src/services/auth/post-refresh.service.js`):
```javascript
const { performPostRefresh } = require('./post-refresh.service');

const result = await performPostRefresh(refreshToken, device);
```

### Error Handling

| Error | Status | Response |
|-------|--------|----------|
| Invalid Token | 401 | `INVALID_REFRESH_TOKEN` |
| Token Mismatch | 401 | `REFRESH_TOKEN_MISMATCH` |
| Session Not Found | 401 | `SESSION_NOT_FOUND` |
| Redis Error | 503 | Service Unavailable |

---

## 👥 Admin Panel Integration

### Responsibility Separation

| Component | Authentication Service | Admin Panel Service |
|-----------|----------------------|-------------------|
| **Identity** | ✅ userId, password, email, phone | ❌ |
| **Roles** | ❌ | ✅ Super Admin, Admin, Moderator |
| **Permissions** | ❌ | ✅ Create, Read, Update, Delete |
| **Hierarchy** | ❌ | ✅ Parent-child relationships |
| **Notifications** | ❌ | ✅ Admin activity alerts |

### Data Flow

#### Super Admin Creation

```
1. Auth Service
   ├─ Create user identity (email, password)
   ├─ Generate userId
   └─ Call: POST /internal/admin/bootstrap { adminId }

2. Admin Panel Service
   ├─ Create admin record
   ├─ Assign super admin role
   ├─ Initialize permissions
   └─ Return success

3. Auth Service
   └─ Complete registration
```

#### Verification Sync

```
1. User verifies email/phone

2. Auth Service
   └─ Call: PATCH /internal/admin/identity-sync
           { adminId, isVerified: true }

3. Admin Panel Service
   ├─ Update admin.isVerified
   └─ Send welcome notification
```

#### Account State Sync

```
1. Admin is blocked/unblocked

2. Auth Service
   └─ Call: PATCH /internal/admin/account-state
           { adminId, isBlocked, isActive }

3. Admin Panel Service
   ├─ Update admin status
   ├─ Revoke active sessions
   └─ Log activity
```

### Failure Handling

**Scenario**: Admin creation fails in Admin Panel Service

```javascript
// In Auth Service bootstrap
try {
  // Step 1: Create in Auth DB
  const user = await createSuperAdmin(data);
  
  // Step 2: Notify Admin Panel
  if (microserviceMode) {
    try {
      await adminPanelClient.bootstrapSuperAdmin(user.userId);
    } catch (error) {
      // Step 3: Rollback Auth DB
      await deleteUser(user.userId);
      throw new Error('Admin Panel Service unavailable');
    }
  }
} catch (error) {
  // Handle error
}
```

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 16+
- MongoDB 4.4+
- Redis 6+ (microservice mode only)

### Installation

1. **Clone & Install**
```bash
git clone <repo-url>
cd Custom_Auth_Service
npm install
```

2. **Configure Environment**

**Monolithic Mode** (`.env`):
```env
MAKE_IT_MICROSERVICE=false
DB_URL=mongodb://localhost:27017/auth_db
PORT_NUMBER=8080
ACCESS_TOKEN_SECRET_CODE=<secret>
REFRESH_TOKEN_SECRET_CODE=<secret>
```

**Microservice Mode** (`.env`):
```env
MAKE_IT_MICROSERVICE=true

# Service Token
SERVICE_TOKEN_SECRET=<strong-random-secret>
SERVICE_INSTANCE_NAME=auth-service-01

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_KEY_SALT=<unique-salt>

# Internal Services
ADMIN_PANEL_SERVICE_URL=http://localhost:8081
SOFTWARE_MANAGEMENT_SERVICE_URL=http://localhost:8082

# MongoDB
DB_URL=mongodb://localhost:27017/auth_db

# JWT Secrets
ACCESS_TOKEN_SECRET_CODE=<secret>
REFRESH_TOKEN_SECRET_CODE=<secret>
```

3. **Start Services**

**Monolithic**:
```bash
npm start
```

**Microservice**:
```bash
# Terminal 1: Redis
docker run -d -p 6379:6379 redis:alpine

# Terminal 2: Auth Service
npm start

# Terminal 3: Admin Panel Service
cd ../Admin_Panel_Service
npm start

# Terminal 4: Software Management Service
cd ../Software_Management_Service
npm start
```

### Verification

Check startup logs:

**Monolithic**:
```
🏢 Running in MONOLITHIC mode
   - No Redis session management
   - No service-to-service communication
   - No service tokens
```

**Microservice**:
```
🔧 Running in MICROSERVICE mode
   - Service Instance: auth-service-01
   - Admin Panel Service: http://localhost:8081
   - Software Management Service: http://localhost:8082
🔐 Generating service token...
✅ Service token initialized (expires in 900s)
✅ Redis connection successful
✅ Microservice initialization completed
⏰ Token rotation scheduler started
```

---

## 🧪 Testing

### Test Monolithic Mode

```bash
# Set environment
export MAKE_IT_MICROSERVICE=false

# Start service
npm start

# Test sign-up
curl -X POST http://localhost:8080/custom-auth-service/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

### Test Microservice Mode

```bash
# Set environment
export MAKE_IT_MICROSERVICE=true
export SERVICE_TOKEN_SECRET=test-secret
export REDIS_KEY_SALT=test-salt

# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start service
npm start

# Test post-refresh
curl -X POST http://localhost:8080/custom-auth-service/api/v1/auth/post-refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<valid-refresh-token>"
  }'
```

### Test Internal APIs

```bash
# Get service token (requires Auth Service running)
SERVICE_TOKEN=$(curl -X POST http://localhost:8080/custom-auth-service/api/v1/internal/token-status \
  -H "x-service-token: <token>" | jq -r '.data.token')

# Test health check
curl http://localhost:8080/custom-auth-service/api/v1/internal/health \
  -H "x-service-token: $SERVICE_TOKEN"
```

### Delete /internal Folder Test

```bash
# Backup first
mv src/internal src/internal.backup

# Set monolithic mode
export MAKE_IT_MICROSERVICE=false

# Start service (should work)
npm start

# Restore
mv src/internal.backup src/internal
```

---

## 🔧 Troubleshooting

### Problem: Service token initialization fails

**Symptoms**:
```
❌ Failed to initialize service token
```

**Solutions**:
1. Check `SERVICE_TOKEN_SECRET` is set
2. Verify MongoDB connection
3. Check database permissions

### Problem: Redis connection fails

**Symptoms**:
```
⚠️  Redis connection failed - session management may not work
```

**Solutions**:
1. Verify Redis is running: `redis-cli ping`
2. Check `REDIS_HOST` and `REDIS_PORT`
3. Test connection: `redis-cli -h <host> -p <port>`

### Problem: Internal API calls fail

**Symptoms**:
```
❌ Admin Panel Service error: 401 - MISSING_SERVICE_TOKEN
```

**Solutions**:
1. Verify service token is being sent
2. Check `x-service-token` header
3. Confirm target service is running
4. Verify service token hasn't expired

### Problem: Post-refresh fails

**Symptoms**:
```
❌ Post-refresh failed: INVALID_REFRESH_TOKEN
```

**Solutions**:
1. Verify refresh token is valid
2. Check token hasn't expired
3. Confirm device UUID matches
4. Verify session exists in database

### Problem: Mode switching issues

**Symptoms**:
- Features not working after mode change
- Internal modules not loading

**Solutions**:
1. Restart service after changing `MAKE_IT_MICROSERVICE`
2. Clear Redis cache: `redis-cli FLUSHDB`
3. Verify all required env variables are set
4. Check startup logs for errors

---

## 📚 References

- [Service Token System](src/internal/service-token/README.md)
- [Redis Session Management](src/internal/redis-session/README.md)
- [Internal API Clients](src/internal/internal-client/README.md)
- [Middleware Documentation](src/internal/middlewares/README.md)

---

## 🔒 Security Considerations

1. **Never expose service tokens** in logs or responses
2. **Rotate secrets regularly** in production
3. **Use TLS/SSL** for inter-service communication
4. **Implement rate limiting** on internal APIs
5. **Monitor token rotation** for anomalies
6. **Encrypt Redis data** at rest
7. **Use strong salts** for Redis key generation
8. **Implement audit logging** for internal calls

---

## 📊 Monitoring & Metrics

### Key Metrics

1. **Service Token**
   - Rotation frequency
   - Time to rotation
   - Failed rotations

2. **Redis Sessions**
   - Active sessions count
   - Hit/miss ratio
   - Average TTL

3. **Internal APIs**
   - Request latency
   - Success/failure rate
   - Retry attempts

4. **System Health**
   - Memory usage
   - CPU usage
   - Network latency

### Logging

All internal operations are logged with structured format:

```
🔐 Internal API accessed by: admin-panel-service (hostname-123-456)
✅ Redis session rotated for user: USR001... (version: 2)
🔄 Service token rotation threshold reached, rotating...
```

---

**Built with ❤️ for Production-Grade Microservices**
