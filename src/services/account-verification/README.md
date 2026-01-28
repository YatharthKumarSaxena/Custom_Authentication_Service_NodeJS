# 📁 Account Verification Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Handles email and device verification processes. Generates, validates, and manages verification codes for new user accounts and new device logins. Ensures account and device authenticity.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all verification services |
| device-verification-security.service.js | Provides security utilities for device verification |
| resend-verification.service.js | Handles resending verification codes |
| verification-generator.service.js | Generates verification codes and tokens |
| verification-validator.service.js | Validates verification codes and tokens |
| verification.service.js | Core verification logic and orchestration |
| verify-device.service.js | Handles device verification process |

## 🔗 Key Files
- **verification.service.js**: Orchestrates the account verification process
- **verification-generator.service.js**: Creates secure verification codes and tokens
- **verification-validator.service.js**: Validates submitted verification codes
- **verify-device.service.js**: Processes device verification for new device logins
- **resend-verification.service.js**: Regenerates and resends verification codes
- **device-verification-security.service.js**: Security utilities for device verification
- **index.js**: Module exports for verification services

## 📝 Usage Notes
- Verification codes are time-limited and single-use
- Supports both email and SMS verification channels
- Device verification triggers on login from unrecognized devices
- Failed verification attempts are rate-limited for security
- Verification status is required before accessing certain features
- Used by verification controllers and authentication flow
