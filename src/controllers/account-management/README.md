# 📁 Account Management Controllers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
HTTP request handlers for account management operations. Process account activation, deactivation, profile updates, password changes, and two-factor authentication management requests.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all account management controllers |
| activate-my-account.controller.js | Handles account reactivation requests |
| change-password.controller.js | Processes password change requests |
| deactivate-my-account.controller.js | Handles account deactivation requests |
| two-factor.controller.js | Manages 2FA setup and configuration |
| update-my-account.controller.js | Processes profile update requests |

## 🔗 Key Files
- **activate-my-account.controller.js**: Handles POST /account/activate to reactivate deactivated accounts
- **deactivate-my-account.controller.js**: Processes POST /account/deactivate for temporary account suspension
- **change-password.controller.js**: Handles POST /account/change-password for authenticated password updates
- **update-my-account.controller.js**: Processes PUT /account/update for profile information changes
- **two-factor.controller.js**: Manages POST /account/2fa endpoints for enabling/disabling 2FA
- **index.js**: Module exports for account management controllers

## 📝 Usage Notes
- All operations require user authentication
- Controllers validate input through middleware before processing
- Password changes invalidate existing sessions for security
- Account deactivation is reversible (not permanent deletion)
- Profile updates are validated and sanitized
- Responses include success confirmations and updated data
- Used by account management routers
