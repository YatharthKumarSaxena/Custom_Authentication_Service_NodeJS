# 📁 Password Management Controllers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
HTTP request handlers for password recovery and reset operations. Process forgot password requests and password reset completions for users who cannot access their accounts.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all password management controllers |
| forgot-password.controller.js | Handles password recovery initiation |
| reset-password.controller.js | Processes password reset completion |

## 🔗 Key Files
- **forgot-password.controller.js**: Handles POST /password/forgot to initiate password recovery and send reset tokens
- **reset-password.controller.js**: Processes POST /password/reset to complete password reset with new password
- **index.js**: Module exports for password management controllers

## 📝 Usage Notes
- No authentication required (for account recovery)
- Reset tokens are time-limited and single-use
- Password reset invalidates all active user sessions
- Email/SMS notifications sent with reset instructions
- Rate limiting prevents abuse and brute force attempts
- Used by password management routers
- Critical for user account recovery workflow
