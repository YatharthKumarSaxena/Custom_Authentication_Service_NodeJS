# ⚡ Quick Start - Microservice Mode

## Enable Microservice Integration in 5 Minutes

---

## 📋 Prerequisites

- ✅ Node.js 16+ installed
- ✅ MongoDB running (local or remote)
- ✅ Redis installed (Docker or native)

---

## 🚀 Step 1: Install Dependencies

```bash
npm install
```

This will install:
- `axios` - HTTP client for internal API calls
- `uuid` - Generate unique service instance IDs
- All existing dependencies

---

## 🔧 Step 2: Configure Environment

Update your `.env` file:

```env
# ========== Microservice Mode ==========
MAKE_IT_MICROSERVICE=true

# ========== Service Token ==========
SERVICE_TOKEN_SECRET=change-this-to-a-strong-random-secret-in-production
SERVICE_INSTANCE_NAME=auth-service-01

# ========== Redis Configuration ==========
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_SALT=change-this-to-a-unique-salt-in-production

# ========== Internal Service URLs ==========
ADMIN_PANEL_SERVICE_URL=http://localhost:8081
SOFTWARE_MANAGEMENT_SERVICE_URL=http://localhost:8082

# ========== Existing Configuration ==========
# Keep all your existing DB, JWT, SMTP configs...
DB_URL=mongodb://localhost:27017/custom_auth_service_db
PORT_NUMBER=8080
# ... (rest of your config)
```

---

## 🐳 Step 3: Start Redis

### Option A: Docker (Recommended)
```bash
docker run -d \
  --name redis-auth \
  -p 6379:6379 \
  redis:alpine
```

### Option B: Native Installation

**macOS**:
```bash
brew install redis
redis-server
```

**Ubuntu/Debian**:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows**:
```bash
# Use WSL or Docker
```

### Verify Redis
```bash
redis-cli ping
# Should return: PONG
```

---

## ▶️ Step 4: Start Authentication Service

```bash
npm start
```

### Expected Output

```
🏢 Running in MICROSERVICE mode
   - Service Instance: auth-service-01
   - Admin Panel Service: http://localhost:8081
   - Software Management Service: http://localhost:8082

🔐 Generating service token...
✅ Service token initialized (expires in 900s)
✅ Redis connection successful
✅ Microservice configuration valid
✅ Microservice initialization completed
⏰ Token rotation scheduler started

🚀 Server running on port 8080
```

---

## ✅ Step 5: Verify Setup

### Test 1: Check Service Token Status

```bash
curl http://localhost:8080/custom-auth-service/api/v1/internal/health \
  -H "x-service-token: <will-fail-needs-token>"
```

Expected: `401 Unauthorized` (This is correct! Internal APIs are protected)

### Test 2: Check Redis Sessions

```bash
redis-cli
> KEYS auth:session:*
(empty array)  # No sessions yet
```

### Test 3: Sign Up and Check Redis

```bash
# Sign up
curl -X POST http://localhost:8080/custom-auth-service/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "firstName": "Test"
  }'

# Check Redis
redis-cli KEYS "auth:session:*"
# Should show: 1) "auth:session:<hash>"
```

### Test 4: Post-Refresh API

```bash
# First, sign in to get tokens
# Then use refresh token:

curl -X POST http://localhost:8080/custom-auth-service/api/v1/auth/post-refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<your-refresh-token>"
  }'
```

---

## 🔄 Switching Back to Monolithic Mode

```bash
# Update .env
MAKE_IT_MICROSERVICE=false

# Restart
npm restart
```

Output:
```
🏢 Running in MONOLITHIC mode
   - No Redis session management
   - No service-to-service communication
   - No service tokens
```

---

## 🏗️ Complete Microservice Setup

For full microservice architecture, you need to run other services:

### Terminal 1: Redis
```bash
docker run -d -p 6379:6379 --name redis-auth redis:alpine
```

### Terminal 2: Authentication Service
```bash
cd Custom_Auth_Service
npm start
```

### Terminal 3: Admin Panel Service
```bash
cd ../Admin_Panel_Service
npm install
npm start
```

### Terminal 4: Software Management Service
```bash
cd ../Software_Management_Service
npm install
npm start
```

---

## 🧪 Testing Internal APIs

### Get Service Token (Manually)

In microservice mode, you can check token status:

```bash
# This endpoint is protected but you can access it after authentication
# For testing, check logs for the generated token
```

### Test Admin Bootstrap

```javascript
// In your code or test script
const internal = require('./src/internal');
const { adminPanelClient } = internal.clients;

await adminPanelClient.bootstrapSuperAdmin('USR001');
```

### Monitor Redis Sessions

```bash
# Watch Redis keys in real-time
redis-cli --scan --pattern "auth:session:*"

# Get session data
redis-cli GET "auth:session:<hash>"

# Count active sessions
redis-cli KEYS "auth:session:*" | wc -l
```

---

## 📊 Monitoring

### Service Token Status

Add this to your admin dashboard:

```javascript
const { getTokenStatus } = require('./src/internal').serviceToken;

setInterval(() => {
  const status = getTokenStatus();
  console.log('Token Status:', {
    expires: status.expiresAt,
    remaining: status.timeRemaining,
    needsRotation: status.needsRotation
  });
}, 60000); // Every minute
```

### Redis Health

```bash
redis-cli INFO stats | grep total_connections_received
redis-cli INFO memory | grep used_memory_human
```

---

## ❌ Troubleshooting

### Problem: "SERVICE_TOKEN_SECRET is not configured"

**Solution**:
```bash
# Add to .env
SERVICE_TOKEN_SECRET=your-secure-random-secret-here
```

### Problem: Redis connection failed

**Solution**:
```bash
# Check Redis is running
redis-cli ping

# Check Redis host/port in .env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Problem: Internal API calls fail

**Solution**:
1. Verify `ADMIN_PANEL_SERVICE_URL` is correct
2. Ensure target service is running
3. Check network connectivity
4. Verify service token is valid

### Problem: Sessions not storing in Redis

**Solution**:
```bash
# Check Redis logs
docker logs redis-auth

# Verify Redis is writable
redis-cli SET test "value"
redis-cli GET test
redis-cli DEL test
```

---

## 🔒 Production Setup

### 1. Generate Strong Secrets

```bash
# Service Token Secret (32+ characters)
openssl rand -base64 32

# Redis Key Salt (32+ characters)
openssl rand -base64 32
```

### 2. Use Environment Variables

```bash
# Never commit secrets to git!
export SERVICE_TOKEN_SECRET=$(openssl rand -base64 32)
export REDIS_KEY_SALT=$(openssl rand -base64 32)
```

### 3. Redis Persistence

```bash
docker run -d \
  --name redis-auth \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:alpine redis-server --appendonly yes
```

### 4. Service URLs

Use internal DNS or service discovery:
```env
ADMIN_PANEL_SERVICE_URL=http://admin-panel-service:8081
SOFTWARE_MANAGEMENT_SERVICE_URL=http://software-management-service:8082
```

### 5. Health Checks

Set up monitoring for:
- Service token rotation
- Redis connection
- Internal API latency
- Session count

---

## 📚 Next Steps

1. Read [MICROSERVICE_GUIDE.md](./MICROSERVICE_GUIDE.md) for detailed documentation
2. Check [src/internal/README.md](./src/internal/README.md) for internal module details
3. Implement Admin Panel Service endpoints
4. Set up monitoring and logging
5. Configure production secrets
6. Test failure scenarios
7. Implement rollback logic

---

## 🎯 Quick Reference

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MAKE_IT_MICROSERVICE` | ✅ | `false` | Enable microservice mode |
| `SERVICE_TOKEN_SECRET` | ✅* | - | Service token signing secret |
| `REDIS_KEY_SALT` | ✅* | - | Salt for Redis key hashing |
| `SERVICE_INSTANCE_NAME` | ❌ | `auth-service-default` | Service instance identifier |
| `ADMIN_PANEL_SERVICE_URL` | ❌ | `http://localhost:8081` | Admin Panel base URL |
| `SOFTWARE_MANAGEMENT_SERVICE_URL` | ❌ | `http://localhost:8082` | Software Management base URL |

\* Required only when `MAKE_IT_MICROSERVICE=true`

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/post-refresh` | POST | Distributed token refresh |
| `/internal/health` | GET | Health check |
| `/internal/token-status` | GET | Service token status |

### Redis Keys

| Pattern | Purpose |
|---------|---------|
| `auth:session:<hash>` | User session storage |
| `auth:session:family:<userId>` | Track user devices |

---

**Ready to go! 🚀**

For questions or issues, check the [MICROSERVICE_GUIDE.md](./MICROSERVICE_GUIDE.md) or create an issue in the repository.
