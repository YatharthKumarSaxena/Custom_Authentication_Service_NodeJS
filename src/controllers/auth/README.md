# 📁 Authentication Controllers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
HTTP request handlers for authentication endpoints. Process user sign-up, sign-in, sign-out, token refresh, and account viewing operations. Serve as the entry point for authentication API routes.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all authentication controllers |
| refresh-token.controller.js | Handles refresh token endpoint requests |
| sign-in.controller.js | Processes user login requests |
| sign-out-all-device.controller.js | Handles sign-out from all devices |
| sign-out-device.controller.js | Processes single device sign-out |
| sign-up.controller.js | Handles user registration requests |
| view-account.controller.js | Retrieves authenticated user account details |
| view-auth-logs.controller.js | Fetches user authentication history |
| view-my-active-devices.controller.js | Lists user's active device sessions |

## 🔗 Key Files
- **sign-up.controller.js**: Handles POST /auth/sign-up for new user registration
- **sign-in.controller.js**: Processes POST /auth/sign-in for user authentication
- **sign-out-device.controller.js**: Handles POST /auth/sign-out for current device logout
- **sign-out-all-device.controller.js**: Processes POST /auth/sign-out-all for terminating all sessions
- **refresh-token.controller.js**: Handles POST /auth/refresh for token renewal
- **view-account.controller.js**: Processes GET /auth/account for retrieving user profile
- **view-auth-logs.controller.js**: Handles GET /auth/logs for authentication history
- **view-my-active-devices.controller.js**: Processes GET /auth/devices for active sessions list

## 📝 Usage Notes
- All controllers follow async/await pattern with error handling
- Request validation is handled by middleware before reaching controllers
- Responses follow standardized format (success/error structure)
- Authentication required for all endpoints except sign-up and sign-in
- Controllers delegate business logic to authentication services
- Used by authentication routers to handle incoming API requests
