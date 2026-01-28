# 📁 Internal Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Contains internal administrative services used by super admins and system administrators. Provides functionality for user and device management, monitoring, and control operations that are not exposed to regular users.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all internal services for external use |
| auth-log.service.js | Retrieves authentication logs for specific users |
| get-user-details.service.js | Fetches comprehensive user account information |
| get-user-device.service.js | Retrieves device information for specific users |
| toggle-device-block-status.service.js | Enables/disables specific user devices |
| toggle-user-block-status.service.js | Blocks or unblocks user accounts |

## 🔗 Key Files
- **get-user-details.service.js**: Retrieves complete user account details for administrative review
- **get-user-device.service.js**: Fetches device information associated with a user account
- **auth-log.service.js**: Provides access to user authentication history and logs
- **toggle-user-block-status.service.js**: Controls user account access by blocking/unblocking
- **toggle-device-block-status.service.js**: Manages device-level access control
- **index.js**: Module exports for internal service access

## 📝 Usage Notes
- These services are restricted to admin and super-admin roles only
- Used for user management, security monitoring, and incident response
- Provides critical administrative control over user accounts and devices
- All operations are logged for audit purposes
- Should never be directly accessible to regular users
