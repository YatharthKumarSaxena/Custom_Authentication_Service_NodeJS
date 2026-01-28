# 📁 Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains the business logic layer of the authentication service. Services handle complex operations, coordinate between models and controllers, and implement the core functionality for authentication, account management, and user verification.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| account-management/ | Folder | User account CRUD and profile management services |
| account-verification/ | Folder | Email and phone verification services |
| audit/ | Folder | Audit logging and tracking services |
| auth/ | Folder | Login, logout, and session management services |
| bootstrap/ | Folder | Application initialization services |
| common/ | Folder | Shared service utilities |
| counter-rollback.service.js | File | ID counter rollback on failed operations |
| factories/ | Folder | Service factory patterns |
| internals/ | Folder | Internal administrative services |
| mail.service.js | File | Email sending service wrapper |
| password-management/ | Folder | Password reset and change services |
| sms.service.js | File | SMS sending service wrapper |
| system/ | Folder | System-level operations |
| templates/ | Folder | Email and SMS template services |
| userId.service.js | File | User ID generation and validation service |

## 🔗 Key Files
- **auth/**: Core authentication services (login, logout, token refresh)
- **account-management/**: User account creation, updates, and deletion
- **account-verification/**: Email and phone number verification workflows
- **password-management/**: Password reset and change functionality
- **mail.service.js**: Sends emails via configured email provider
- **sms.service.js**: Sends SMS messages via configured SMS provider
- **userId.service.js**: Generates unique user IDs with prefixes
- **counter-rollback.service.js**: Ensures ID counter consistency

## 📝 Notes
- Services encapsulate business logic and keep controllers thin
- Each service folder contains related functionality
- Services interact with models but don't handle HTTP directly
- Factories provide flexible service creation patterns
- Bootstrap services run on application startup
- Internal services are for administrative operations
- Audit services track all important system events
