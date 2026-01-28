# 📁 Middlewares

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains Express middleware functions that process requests before they reach controllers. Middlewares handle authentication, validation, error handling, rate limiting, and other cross-cutting concerns.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| account-management/ | Folder | Account-specific validation middleware |
| account-verification/ | Folder | Verification request validation middleware |
| auth/ | Folder | Authentication and authorization middleware |
| common/ | Folder | Shared middleware utilities |
| factory/ | Folder | Middleware factory patterns |
| handlers/ | Folder | Error and response handlers |
| index.js | File | Central export file for all middleware |
| password-management/ | Folder | Password management validation middleware |

## 🔗 Key Files
- **auth/**: JWT verification, session validation, authentication checks
- **account-management/**: Request validation for account operations
- **account-verification/**: Validation for verification workflows
- **password-management/**: Validation for password operations
- **common/**: Shared middleware (logging, CORS, body parsing)
- **handlers/**: Error handling and response formatting
- **factory/**: Creates dynamic middleware based on configuration
- **index.js**: Exports all middleware for easy importing

## 📝 Notes
- Middleware executes before route handlers
- Order of middleware matters in the application
- Authentication middleware should run early in the chain
- Validation middleware prevents invalid data from reaching services
- Error handlers should be registered last
- Factory patterns enable reusable middleware creation
- Keep middleware focused on single responsibility
