# 📁 Password Management Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Middleware components for password management route validation. Handle field validation and request validation specifically for password recovery and reset operations.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all password management middleware |
| field-validation.middleware.js | Validates password management request fields |
| validate-request-body.middleware.js | Validates request body structure |

## 🔗 Key Files
- **field-validation.middleware.js**: Validates email, reset tokens, new passwords, and other password-related fields
- **validate-request-body.middleware.js**: Ensures request body structure is correct for password management endpoints
- **index.js**: Module exports for password management middleware

## 📝 Usage Notes
- Applied to password reset routes before controller execution
- Validates password strength requirements
- Checks reset token format and presence
- Returns validation errors before reaching controller
- Used by password management routers
- Enforces password policies and security requirements
