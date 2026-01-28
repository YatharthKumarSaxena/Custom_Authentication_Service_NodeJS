# 📁 src - Source Code Directory

> Welcome! I am the README file of the **src** folder to assist you in understanding the complete source code structure and organization of this Custom Authentication Service.

---

## 📋 Folder Purpose

This is the **main source code directory** containing all the core application logic, configurations, models, controllers, services, middlewares, and utilities that power the Custom Authentication Service. Everything required to run the backend authentication system is organized here.

---

## 📊 Folder Statistics

**Total Folders:** 10  
**Total Files (root level):** 2

---

## 📂 Folder Structure

| Folder/File | Type | Description |
|------------|------|-------------|
| **app.js** | File | Main Express application initialization and configuration |
| **README.md** | File | This documentation file |
| **configs/** | Folder | Configuration files for database, security, validation, etc. (27 files) |
| **controllers/** | Folder | HTTP request handlers for all API endpoints (5 subfolders) |
| **cron-jobs/** | Folder | Scheduled tasks for cleanup and maintenance (6 jobs) |
| **middlewares/** | Folder | Request validation, authentication, and error handling (7 subfolders) |
| **models/** | Folder | Mongoose schemas for database collections (9 models) |
| **rate-limiters/** | Folder | Rate limiting implementations for API protection (6 limiters) |
| **routers/** | Folder | Route definitions and endpoint mappings (7 route files) |
| **services/** | Folder | Business logic and core functionality (11 subfolders) |
| **utils/** | Folder | Utility functions and helper modules (23 utilities) |

---

## 🔗 Key Components

### 🎯 **app.js**
The main Express application entry point that:
- Initializes all middlewares
- Configures body parsers and cookie parser
- Mounts all route handlers
- Sets up global error handling
- Exports the configured Express app

### 📁 **configs/**
Central configuration hub containing:
- Database connection settings
- JWT token configuration
- Security policies (2FA, rate limiting)
- Email/SMS notification settings
- Validation rules and regex patterns
- Environment-specific settings

### 🎮 **controllers/**
Request handlers organized by feature:
- **auth/** - Sign up, sign in, sessions
- **account-management/** - Profile updates, account status
- **account-verification/** - Email/phone verification
- **password-management/** - Forgot/reset password
- **internals/** - Internal API endpoints

### ⏰ **cron-jobs/**
Automated scheduled tasks:
- Cleanup expired sessions (Daily 2 AM)
- Delete deactivated users (Weekly)
- Remove used verifications (Daily 4 AM)
- Archive old auth logs (Weekly)
- Cleanup inactive devices (Weekly, disabled by default)

### 🛡️ **middlewares/**
Request processing layers:
- **auth/** - Token verification, device validation
- **account-management/** - Account update validation
- **account-verification/** - Verification input validation
- **password-management/** - Password policy enforcement
- **common/** - Shared middleware utilities
- **factory/** - Middleware factory patterns
- **handlers/** - Error and 404 handlers

### 📦 **models/**
Database schema definitions:
- User, Device, UserDevice
- OTP, VerificationLink
- AuthLog, SystemLog
- Counter (for ID generation)

### 🚦 **rate-limiters/**
API protection mechanisms:
- Global rate limiter
- Device-specific limiters
- User-specific limiters
- Route-specific limiters

### 🛣️ **routers/**
API endpoint definitions:
- auth.routes.js
- account-management.routes.js
- account-verification.routes.js
- password-management.routes.js
- internal.routes.js
- index.js (route aggregator)

### ⚙️ **services/**
Core business logic:
- **auth/** - Authentication flows
- **account-management/** - Account operations
- **account-verification/** - Verification logic
- **password-management/** - Password operations
- **audit/** - Logging and audit trails
- **bootstrap/** - Super admin creation
- **common/** - Shared services
- **factories/** - Service factories
- **internals/** - Internal operations
- **system/** - System-level operations
- **templates/** - Email/SMS templates

### 🔧 **utils/**
Helper functions and utilities:
- Token generation and validation
- OTP generation and hashing
- Email and SMS sending
- Error handling
- Input validation
- Time-stamp formatting
- Contact selection logic

---

## 📝 Architecture Overview

```
src/
├── app.js                    # Express app initialization
├── configs/                  # All configuration files
├── models/                   # Database schemas
├── controllers/              # HTTP handlers
├── services/                 # Business logic
├── middlewares/              # Request processors
├── routers/                  # Route definitions
├── utils/                    # Helper functions
├── rate-limiters/            # Rate limiting
└── cron-jobs/               # Scheduled tasks
```

---

## 🔄 Request Flow

```
1. Client Request
   ↓
2. Router (routes/)
   ↓
3. Middleware (middlewares/)
   - Authentication
   - Validation
   - Rate Limiting
   ↓
4. Controller (controllers/)
   ↓
5. Service (services/)
   - Business Logic
   - Database Operations
   ↓
6. Model (models/)
   - MongoDB Operations
   ↓
7. Response back to Client
```

---

## 🚀 Usage Notes

### Starting the Application
The application is started from the root `server.js` file, which:
1. Connects to MongoDB
2. Bootstraps Super Admin
3. Imports this `app.js`
4. Starts the Express server
5. Initializes cron jobs

### Adding New Features
1. **Create Model** (if needed) in `models/`
2. **Add Service** logic in `services/`
3. **Create Controller** handler in `controllers/`
4. **Define Route** in `routers/`
5. **Add Middleware** (if needed) in `middlewares/`
6. **Update Config** (if needed) in `configs/`

### Code Organization Principles
- **Separation of Concerns** - Each folder has a specific purpose
- **Modularity** - Components are independent and reusable
- **Scalability** - Easy to add new features
- **Maintainability** - Clear structure and documentation

---

## 📚 Documentation

Each subfolder contains its own README.md with detailed information about:
- Purpose and responsibility
- File descriptions
- Usage examples
- Important notes

Explore individual folder READMEs for more details!

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Token refresh and rotation
- ✅ Multi-device session management
- ✅ Rate limiting on all endpoints
- ✅ Input validation and sanitization
- ✅ Password hashing with bcrypt
- ✅ Device verification
- ✅ Two-factor authentication
- ✅ Audit logging

---

## 📊 Project Statistics

- **Total Subfolders:** 33+ (including nested)
- **Total Files:** 150+ code files
- **Total README Files:** 33 documentation files
- **Lines of Code:** 10,000+ lines
- **API Endpoints:** 20+ endpoints
- **Database Models:** 9 schemas
- **Cron Jobs:** 6 automated tasks

---

**Status:** ✅ Production Ready  
**Documentation:** Complete  
**Last Updated:** January 28, 2026