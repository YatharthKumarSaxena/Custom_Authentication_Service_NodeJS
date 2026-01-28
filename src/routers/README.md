# 📁 Routers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains Express router definitions that map HTTP endpoints to their corresponding middleware and controllers. Routers organize the API structure and define all available endpoints.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| account-management.routes.js | File | Routes for account CRUD operations |
| account-verification.routes.js | File | Routes for email/phone verification |
| auth.routes.js | File | Routes for login, logout, token management |
| index.js | File | Central router aggregation and export |
| internal.routes.js | File | Internal administrative endpoints |
| middleware.gateway.routes.js | File | Middleware gateway routing logic |
| password-management.routes.js | File | Routes for password reset and change |

## 🔗 Key Files
- **auth.routes.js**: Authentication endpoints (POST /login, /logout, /refresh)
- **account-management.routes.js**: Account endpoints (POST /register, GET /profile, PUT /update, DELETE /deactivate)
- **account-verification.routes.js**: Verification endpoints (POST /verify-email, /verify-phone)
- **password-management.routes.js**: Password endpoints (POST /forgot-password, /reset-password)
- **internal.routes.js**: Administrative endpoints for internal use
- **middleware.gateway.routes.js**: Gateway for middleware routing
- **index.js**: Combines all routes and mounts them on the main app

## 📝 Notes
- All routes are prefixed with their domain (e.g., /api/auth, /api/account)
- Each route applies appropriate middleware before controllers
- Routes are protected with authentication middleware where needed
- Rate limiting is applied per route group
- Internal routes require special authorization
- The index.js file aggregates all routes for the main application
- Follow RESTful conventions for endpoint design
