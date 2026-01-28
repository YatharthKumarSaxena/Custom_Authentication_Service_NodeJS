# 📁 Account Verification Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Middleware components for verification route validation and processing. Handle field validation, request validation, and verification-specific checks for account and device verification endpoints.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all verification middleware |
| field-validation.middleware.js | Validates verification request fields |
| validate-request-body.middleware.js | Validates request body structure |
| verification.middleware.js | Handles verification-specific logic |

## 🔗 Key Files
- **field-validation.middleware.js**: Validates verification code, email, and other verification-related fields
- **validate-request-body.middleware.js**: Ensures request body structure is correct for verification endpoints
- **verification.middleware.js**: Handles verification-specific checks and logic (token validation, expiry checks, etc.)
- **index.js**: Module exports for verification middleware

## 📝 Usage Notes
- Applied to verification routes before controller execution
- Validates verification codes and tokens
- Checks verification attempt limits and rate limiting
- Returns validation errors before reaching controller
- Used by verification routers
- Critical for secure verification flow
