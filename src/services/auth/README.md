# 📁 Authentication Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Core authentication services handling user sign-up, sign-in, sign-out, session management, and authentication security. Manages tokens, cookies, device tracking, and authentication audit logs.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all authentication services |
| account-details.service.js | Retrieves authenticated user account information |
| active-sessions.service.js | Manages and retrieves user active sessions |
| auth-cookie-service.js | Handles authentication cookie operations |
| auth-log.service.js | Logs authentication events and activities |
| auth-security.service.js | Provides security utilities for authentication |
| auth-session.service.js | Manages user session lifecycle and validation |
| device.service.js | Handles device registration and tracking |
| login-policy-checker.service.js | Validates login policies and restrictions |
| refresh-token.service.js | Manages refresh token generation and validation |
| session-token.service.js | Handles session token operations |
| sign-in.service.js | Processes user sign-in requests |
| sign-out.service.js | Handles user sign-out operations |
| sign-up.service.js | Manages new user registration |

## 🔗 Key Files
- **sign-up.service.js**: Handles new user registration with validation and account creation
- **sign-in.service.js**: Authenticates users and creates new sessions
- **sign-out.service.js**: Terminates user sessions and cleans up authentication data
- **refresh-token.service.js**: Generates and validates refresh tokens for session renewal
- **session-token.service.js**: Manages short-lived session tokens
- **auth-session.service.js**: Centralized session management and validation
- **device.service.js**: Tracks and manages user devices for security
- **auth-log.service.js**: Maintains audit trail of authentication events
- **login-policy-checker.service.js**: Enforces login policies and restrictions

## 📝 Usage Notes
- All authentication flows pass through these services
- Implements JWT-based authentication with refresh token rotation
- Supports device tracking for enhanced security
- Maintains comprehensive audit logs for compliance
- Used by authentication controllers and middleware
- Critical for application security and user access control
