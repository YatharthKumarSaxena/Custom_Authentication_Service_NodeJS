# 📁 Controllers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains HTTP request handlers (controllers) that process incoming requests, validate input, call appropriate services, and send responses. Controllers act as the interface between routes and business logic.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| account-management/ | Folder | Account creation, update, delete, and profile controllers |
| account-verification/ | Folder | Email and phone verification request controllers |
| auth/ | Folder | Login, logout, token refresh controllers |
| index.js | File | Central export file for all controllers |
| internals/ | Folder | Internal administrative endpoint controllers |
| password-management/ | Folder | Password reset and change controllers |

## 🔗 Key Files
- **auth/**: Handles login, logout, session management endpoints
- **account-management/**: Manages user account CRUD operations
- **account-verification/**: Processes verification code requests and validation
- **password-management/**: Handles forgot password and password change flows
- **internals/**: Administrative endpoints for internal operations
- **index.js**: Exports all controllers for use in routing

## 📝 Notes
- Controllers handle HTTP-specific logic (request/response)
- They validate incoming data using middleware
- Controllers call services to execute business logic
- They format and send appropriate HTTP responses
- Error handling is done through middleware
- Each controller folder corresponds to a route group
- Keep controllers thin - business logic belongs in services
