# 📁 Account Management Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Manages user account lifecycle operations including activation, deactivation, profile updates, password changes, and two-factor authentication. Provides services for users to maintain and secure their accounts.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all account management services |
| account-activation.service.js | Handles user account activation |
| account-deactivation.service.js | Processes account deactivation requests |
| change-password.service.js | Manages password change operations |
| two-factor.service.js | Handles two-factor authentication setup and management |
| update-account.service.js | Processes account profile updates |

## 🔗 Key Files
- **account-activation.service.js**: Reactivates previously deactivated user accounts
- **account-deactivation.service.js**: Temporarily disables user accounts (soft delete)
- **change-password.service.js**: Allows authenticated users to update their passwords
- **update-account.service.js**: Handles user profile information updates
- **two-factor.service.js**: Manages 2FA setup, enabling, and disabling
- **index.js**: Module exports for account management services

## 📝 Usage Notes
- All operations require user authentication
- Password changes trigger session invalidation for security
- Account deactivation is reversible (not permanent deletion)
- Two-factor authentication adds an extra security layer
- Profile updates are validated before being saved
- Used by account management controllers for user-initiated operations
