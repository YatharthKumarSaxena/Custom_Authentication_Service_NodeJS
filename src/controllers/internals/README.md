# 📁 Internal Controllers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
HTTP request handlers for internal administrative operations. Provide super admin and admin capabilities for user management, device control, and system monitoring. Not accessible to regular users.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all internal controllers |
| get-user-auth-logs.controller.js | Retrieves authentication logs for specific users |
| get-user-details.controller.js | Fetches comprehensive user account information |
| get-user-device.controller.js | Retrieves device information for users |
| toggle-device-block-status.controller.js | Blocks/unblocks specific user devices |
| toggle-user-block-status.controller.js | Blocks/unblocks user accounts |

## 🔗 Key Files
- **get-user-details.controller.js**: Handles GET /admin/users/:id for retrieving user account details
- **get-user-device.controller.js**: Processes GET /admin/users/:id/devices for device information
- **get-user-auth-logs.controller.js**: Handles GET /admin/users/:id/logs for authentication history
- **toggle-user-block-status.controller.js**: Processes PATCH /admin/users/:id/block for account blocking
- **toggle-device-block-status.controller.js**: Handles PATCH /admin/devices/:id/block for device control
- **index.js**: Module exports for internal controllers

## 📝 Usage Notes
- Restricted to admin and super-admin roles only
- Requires elevated permissions and special authentication
- All operations are logged for audit purposes
- Used for user management and security enforcement
- Critical for incident response and user support
- Should never be accessible to regular users
- Used by internal/admin routers
