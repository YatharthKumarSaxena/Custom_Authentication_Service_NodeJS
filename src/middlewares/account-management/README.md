# 📁 Account Management Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Middleware components for account management route validation and processing. Handle field validation and request body validation specifically for account operations like profile updates and password changes.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all account management middleware |
| field-validation.middleware.js | Validates account management request fields |
| validate-request-body.middleware.js | Validates request body structure |
| check-2fa-enabled.middleware.js | Checks if 2FA feature is enabled |
| check-deletion-policy.middleware.js | Validates deletion policy configuration |

## 🔗 Key Files
- **field-validation.middleware.js**: Validates fields for account operations (profile updates, password changes, etc.)
- **validate-request-body.middleware.js**: Ensures request body structure is correct for account management endpoints
- **check-2fa-enabled.middleware.js**: Blocks routes if IS_2FA_FEATURE_ENABLED=false
- **check-deletion-policy.middleware.js**: Validates DELETION_POLICY (SOFT_DELETE, HARD_DELETE, HYBRID)
- **index.js**: Module exports for account management middleware

## 📝 Usage Notes
- Applied to account management routes before controller execution
- Validates fields specific to profile updates and account operations
- Returns validation errors before reaching controller logic
- Used by account management routers
- Ensures data integrity and proper format
- Feature checks ensure system configuration allows requested operations
