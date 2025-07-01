# 📘 Custom Authentication Service

Welcome to the **Custom Authentication Service**, a secure and scalable backend authentication system engineered using **Node.js**, **Express.js**, and **MongoDB**, designed with industry-grade practices such as **Rate Limiting**, **Multi-Device Tracking**, and **Token Rotation (JWT)**. This project is structured with modularity, reusability, and production-readiness in mind, powered by real-world system design and software engineering principles.

---

## 🧭 Table of Contents
- 📖 [Introduction](#-introduction)
- 🧪 [Features](#-features)
- 🔧 [Tech Stack](#-tech-stack)
- 🧠 [Design Principles & Patterns](#-design-principles--patterns)
- 🧱 [Folder Structure](#-folder-structure)
- 🛠️ [Environment Variables](#-environment-variables)
- 🚦 [Rate Limiting Logic](#-rate-limiting-logic)
- 🧪 [Testing Strategy](#-testing-strategy)
- 🧬 [Planned Enhancements](#-planned-enhancements)
- 🎯 [Final Takeaway](#-final-takeaway)

---

## 📖 **Introduction**

This monolithic authentication backend is engineered to support:
- Account creation & secure admin bootstrapping
- Multi-device tracking via `deviceID`
- Refresh and access token generation with custom expiry
- Custom JWT validation middleware
- Admin auto-creation at server start
- Per-device rate limiting for brute-force prevention
- Intelligent logging for each action (e.g., sign in, sign out, register)

The **entry point** for this project is [`server.js`](./server.js), where all major components are initialized including:
- MongoDB connection
- Admin account bootstrap
- Centralized route mounting
- Global error and 404 handling
- Cron job triggers

---

## 🧪 **Features**

| 🔹 Feature                          | ✅ Implemented |
|------------------------------------|----------------|
| Multi-Device Login Tracking        | ✔️             |
| JWT Token Generation & Rotation    | ✔️             |
| Rate Limiting per Device & Route   | ✔️             |
| Admin Auto-Creation at Startup     | ✔️             |
| Authentication Logs                | ✔️             |
| Centralized Error Handling         | ✔️             |
| Cookie Parser + JSON Body Parsing | ✔️             |
| Cron Job Integration               | ✔️             |
| Intelligent 404 Rate Monitoring    | ✔️             |
| Device-Based Refresh Token Logic   | ✔️             |

---

## 🔧 **Tech Stack**

- **Node.js**: Runtime
- **Express.js**: Web framework
- **MongoDB + Mongoose**: NoSQL DB with schema modeling
- **JWT**: Token-based authentication
- **dotenv**: Environment config management
- **cookie-parser**: For handling cookies
- **uuid**: For generating `deviceID`

---

## 🧠 **Design Principles & Patterns**

### ✅ Design Principles

| Principle        | Full Form                                                                 | Usage                                                  |
|------------------|---------------------------------------------------------------------------|--------------------------------------------------------|
| **SOLID**        | Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion | Modular services, controllers, utils follow SRP       |
| **DRY**          | Don’t Repeat Yourself                                                     | Reused logic across tokens, logging, error handlers    |
| **KISS**         | Keep It Simple, Stupid                                                    | Clear token logic, admin setup kept straightforward    |
| **YAGNI**        | You Aren’t Gonna Need It                                                  | Avoided premature scaling or over-engineering          |

### ✅ Design Patterns Used

| Pattern              | Purpose                                                                |
|----------------------|------------------------------------------------------------------------|
| **Singleton**        | MongoDB connection, express server bootstrap                          |
| **Factory**          | Token generation utility with expiry injection                        |
| **Template Method**  | Used in log writing & token validation flow (extendable blueprint)     |
| **Observer** (simulated) | Setup ready for future log-subscriber or event-bus design          |

---

## 🧱 **Folder Structure**

> 📦 Total **11 folders** and **5 files** are present in this project directory.

### 📁 Folders

| Folder Name            | Description |
|------------------------|-------------|
| 📁 `rate-limiters/`    | Device & route-specific rate limit services |
| 📁 `controllers/`      | Handles business logic for auth routes       |
| 📁 `configs/`          | Configuration files for DB, server, tokens   |
| 📁 `middlewares/`      | JWT auth, global error, malformed JSON etc.  |
| 📁 `utils/`            | Utility functions like token creation, logs  |
| 📁 `services/`         | Handles internal logic like limiter service  |
| 📁 `routes/`           | Route entry-point for all modules            |
| 📁 `models/`           | MongoDB schemas: User, Auth Logs             |
| 📁 `cron-jobs/`        | Server-triggered tasks on boot               |
| 📁 `internal-calls/`   | For internal microservice/API interaction    |
| 📁 `node_modules/`     | Auto-installed dependencies (ignored in Git) |

### 📄 Files

| File Name               | Description                                  |
|-------------------------|----------------------------------------------|
| `server.js`             | 🎯 Entry point — starts DB, routes, admin    |
| `.env.example`          | 🌐 Sample environment configuration          |
| `package.json`          | 📦 Project metadata and script definitions   |
| `package-lock.json`     | 🔒 Locked dependency tree for consistent build |
| `.gitignore`            | 🚫 Files/directories ignored in version control |

---

## 🛠️ **Environment Variables**

All sensitive credentials and project configurations are handled using environment variables. These variables are not committed for security reasons, but a complete structure is provided in the [`.env.example`](./.env.example) file.

Each environment variable plays a crucial role in how this service runs. Below is a breakdown of the major groups and their responsibilities:

### 🔹 Server Configuration
Used to set the port on which the server will run locally or in production.
- `PORT_NUMBER`

### 🔹 MongoDB Database
Defines the local database name and MongoDB connection URI.
- `DB_NAME`
- `DB_URL`

### 🔹 JWT Token System
Handles the secure issuance and expiry of both access and refresh tokens, including token rotation threshold.
- `ACCESS_TOKEN_SECRET_CODE`
- `REFRESH_TOKEN_SECRET_CODE`
- `ACCESS_TOKEN_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`
- `REFRESH_THRESHOLD_IN_MS`

### 🔹 Bcrypt Password Hashing
Specifies the salt rounds used for secure password encryption.
- `SALT`

### 🔹 Admin User Bootstrap
At startup, the system auto-creates a default admin user using these credentials.
- `ADMIN_NAME`
- `ADMIN_COUNTRY_CODE`
- `ADMIN_NUMBER`
- `ADMIN_FULL_PHONE_NUMBER`
- `ADMIN_EMAIL_ID`
- `ADMIN_PASSWORD` (already hashed using bcrypt)
- `ADMIN_USER_ID`

### 🔹 System Infrastructure Settings
Used to define instance-specific capacity and IP-code logic.
- `IP_ADDRESS_CODE`
- `USER_REGISTRATION_CAPACITY`

### 🔹 Cookie Policy
Sets client cookie behaviors for session management. Values should change between development and production environments.
- `COOKIE_HTTP_ONLY`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `COOKIE_DOMAIN`

### 🔹 Device Identification (for Testing)
Used to simulate real-world testing with device-based rate limiting and refresh token storage.
- `DEVICE_UUID`
- `DEVICE_TYPE`
- `DEVICE_NAME`

### 🔹 Auth & User Cleanup Cron Jobs
These are automated scheduled tasks that run weekly to clean up outdated logs or inactive users.
- `AUTH_LOG_CLEANUP_CRON`
- `AUTH_LOG_CLEANUP_TIMEZONE`
- `AUTH_LOG_RETENTION_DAYS`
- `USER_CLEANUP_CRON`
- `USER_CLEANUP_TIMEZONE`
- `USER_RETENTION_DAYS`

### 🔹 App Environment Mode
Defines the execution environment (`development` | `production`).
- `NODE_ENV`

> 📌 Make sure to copy `.env.example` and rename it to `.env` before running the application. Fill in appropriate secrets and values as needed for your machine.

---

## 🚦 **Rate Limiting Logic**

This system implements **device-based** and **route-specific** rate limiting to prevent abuse, brute-force attacks, and excessive invalid requests.

### 📌 Highlights:
- Every incoming request includes a `deviceID` (from request headers).
- If the device is not recognized or is hitting **unknown/unauthorized endpoints**, it’s still tracked.
- Each device-route combination has its own limit logic.

### 🧠 How it Works:
- Rate limit metadata is stored in MongoDB per device and route.
- If a device crosses its threshold within a specific time window (e.g., 60 seconds), it is **temporarily blocked**.
- The system sends a `Retry-After` header to inform clients when they can retry.
- Smart logging ensures that no request gets dropped silently — even invalid paths get monitored and tracked.

> This also helps during attacks where bots attempt undefined endpoints to exploit the backend.

---

## 🧪 **Testing Strategy**

This project was thoroughly tested via **Postman**, ensuring real-world scenarios like:

### 🔐 Authentication Tests:
- ✅ Registering a user with phone/email
- ✅ Signing in on multiple devices
- ✅ Logout from one or all devices
- ✅ Token expiration and refresh

### ⚠️ Security Tests:
- ✅ Attempted login with wrong credentials
- ✅ Tampered JWTs
- ✅ Missing/Invalid deviceID in headers
- ✅ Repeated requests to unauthorized endpoints

### 🧪 Behavior Tests:
- ✅ Cron jobs triggering on time
- ✅ Admin bootstrapping on server restart
- ✅ Logs created and pruned as expected

> In future, automated test suites (like Jest + Supertest) can be integrated for CI/CD pipelines.

---

## 🧬 **Planned Enhancements**

Even though the system is fully functional, the following improvements are under consideration for future versions:

| 🔮 Enhancement                     | Priority | Notes |
|----------------------------------|----------|-------|
| Role-Based Access Control (RBAC) | 🔺 High   | Allow role assignment to users (e.g., ADMIN, MODERATOR, USER) |
| OTP-Based Authentication         | 🔺 High   | Add SMS/Email-based OTPs for passwordless login |
| API Rate Limits per User Tier    | 🔸 Medium | Different limits for free vs. premium accounts |
| MongoDB Index Optimization       | 🔸 Medium | Speed up query performance and reduce latency |
| Test Automation                  | 🔹 Low    | Integrate with CI/CD for robust test coverage |

---

## 🎯 **Final Takeaway**

This project reflects a **deep understanding of authentication systems**, **production-level design thinking**, and **scalable backend engineering**. The goal wasn’t just to build an auth system, but to simulate the real-life challenges and decisions involved in developing a secure, intelligent, and maintainable authentication layer.

### 💡 What You’ll Learn from This Repo:
- How to issue and rotate secure JWTs
- How to bootstrap admin users safely
- How to scale multi-device login systems
- How to implement custom rate limiting logic
- How to structure Node.js projects with clean separation of concerns

---

> 📍 Feel free to clone, fork, or adapt this architecture to your own real-world applications.  
> Designed & Engineered by **Yatharth Kumar Saxena** 🚀
