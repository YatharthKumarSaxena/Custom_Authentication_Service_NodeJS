# 📁 Common Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Shared middleware components used across multiple routes. Provide common functionality for user verification, device checking, account status validation, and token verification used throughout the application.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all common middleware |
| check-user-is-verified.middleware.js | Checks if user account is verified |
| global-error-handler.middleware.js | Catches and formats all application errors |
| is-device-blocked.middleware.js | Checks if user device is blocked |
| is-user-account-active.middleware.js | Validates user account is active |
| is-user-blocked.middleware.js | Checks if user account is blocked |
| verify-device-field.middleware.js | Validates device-related fields |
| verify-token.middleware.js | Validates authentication tokens |

## 🔗 Key Files
- **global-error-handler.middleware.js**: Centralized error handling for all routes, formats error responses
- **verify-token.middleware.js**: Validates JWT tokens and attaches decoded data to request
- **check-user-is-verified.middleware.js**: Ensures user has completed verification before accessing features
- **is-user-blocked.middleware.js**: Prevents blocked users from accessing the system
- **is-device-blocked.middleware.js**: Prevents access from blocked devices
- **is-user-account-active.middleware.js**: Ensures account is not deactivated
- **verify-device-field.middleware.js**: Validates device information in requests
- **index.js**: Module exports for common middleware

## 📝 Usage Notes
- Used across multiple route modules for consistent security checks
- Applied in order: token validation → user checks → device checks
- Reduces code duplication across different routers
- Provides consistent security enforcement
- Global error handler should be last middleware in the chain
- Critical for application-wide security and error handling
