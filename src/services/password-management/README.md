# 📁 Password Management Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Manages password recovery and reset operations for users who have forgotten their passwords. Handles secure password reset token generation, validation, and the password update process.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all password management services |
| forgot-password.service.js | Initiates password recovery process |
| password-verification.service.js | Validates password reset tokens |
| reset-password.service.js | Processes password reset with new password |

## 🔗 Key Files
- **forgot-password.service.js**: Generates password reset tokens and sends recovery emails
- **password-verification.service.js**: Validates password reset tokens for authenticity
- **reset-password.service.js**: Completes password reset with new password
- **index.js**: Module exports for password management services

## 📝 Usage Notes
- Password reset tokens are time-limited (typically 15-30 minutes)
- Tokens are single-use and invalidated after successful reset
- Password reset triggers invalidation of all active sessions
- Recovery emails/SMS are sent through notification services
- Implements rate limiting to prevent abuse
- Used by password management controllers
- Does not require authentication (for forgotten password recovery)
