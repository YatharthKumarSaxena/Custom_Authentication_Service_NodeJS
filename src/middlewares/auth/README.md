# 📁 Authentication Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Middleware components for authentication route validation, authorization, and request processing. Handle authentication checks, user fetching, field validation, and request sanitization specifically for auth endpoints.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all authentication middleware |
| auth.middleware.js | Validates user authentication status |
| fetch-user.middleware.js | Retrieves user data and attaches to request |
| field-validation.middleware.js | Validates authentication request fields |
| first-name.middleware.js | Validates and sanitizes first name field |
| sanitize-auth.middleware.js | Sanitizes authentication payloads |
| validate-request-body.middleware.js | Validates request body structure |

## 🔗 Key Files
- **auth.middleware.js**: Verifies user authentication tokens and authorizes access
- **fetch-user.middleware.js**: Fetches user record from database and attaches to request object
- **field-validation.middleware.js**: Validates required fields for auth endpoints (email, password, etc.)
- **validate-request-body.middleware.js**: Ensures request body has proper structure and required fields
- **sanitize-auth.middleware.js**: Cleans and normalizes authentication payload data
- **first-name.middleware.js**: Special validation for first name field formatting
- **index.js**: Module exports for authentication middleware

## 📝 Usage Notes
- Applied to authentication routes before controller execution
- Middleware chain executes in order: validation → sanitization → authentication → fetch user
- Failed validation returns error responses before reaching controllers
- Used by authentication routers to secure endpoints
- Reduces duplication of validation logic across controllers
- Essential for API security and data integrity
