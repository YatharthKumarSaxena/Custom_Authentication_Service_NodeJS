# 📁 Utils

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains utility functions and helper modules used throughout the authentication service. These utilities handle common tasks like validation, token management, error handling, and data formatting.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| audit-data.util.js | File | Audit trail data extraction and formatting |
| auth.util.js | File | Authentication helper functions |
| contact-selector.util.js | File | Contact information selection logic |
| email-generator.util.js | File | Email content generation utilities |
| enum-validators.util.js | File | Enumeration value validation |
| error-handler.util.js | File | Centralized error handling and formatting |
| extract-token.util.js | File | Token extraction from requests |
| id-validators.util.js | File | ID format and validity validation |
| identifier-validator.factory.util.js | File | Factory for creating identifier validators |
| issue-token.util.js | File | JWT token generation |
| link.util.js | File | Magic link generation and validation |
| notification-dispatcher.util.js | File | Notification routing (email/SMS) |
| otp.util.js | File | OTP generation and validation utilities |
| redis-client.util.js | File | Redis client wrapper and operations |
| security-context.util.js | File | Security context extraction from requests |
| sms-generator.util.js | File | SMS content generation utilities |
| time-stamps.util.js | File | Timestamp formatting and manipulation |
| token-headers.util.js | File | Token header extraction and parsing |
| url.util.js | File | URL building and manipulation |
| validate-fields.util.js | File | Field validation against rules |
| validate-identifier.util.js | File | User identifier validation |
| validators-factory.util.js | File | Factory for creating field validators |
| verify-token.util.js | File | JWT token verification and decoding |

## 🔗 Key Files
- **error-handler.util.js**: Standardized error response formatting
- **issue-token.util.js**: Creates JWT tokens for authentication
- **verify-token.util.js**: Validates and decodes JWT tokens
- **otp.util.js**: Generates and validates one-time passwords
- **redis-client.util.js**: Interface for Redis caching operations
- **notification-dispatcher.util.js**: Routes notifications to appropriate channels
- **validate-fields.util.js**: Core field validation logic
- **validators-factory.util.js**: Creates custom validators dynamically

## 📝 Notes
- All utilities are pure functions or stateless modules
- Error handling utilities ensure consistent error responses
- Token utilities handle JWT lifecycle (create, verify, refresh)
- Validation utilities are used by middleware and controllers
- Redis utilities provide caching and session management
- Factory patterns enable flexible validator creation
