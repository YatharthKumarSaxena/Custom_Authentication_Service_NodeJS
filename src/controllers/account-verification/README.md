# 📁 Account Verification Controllers

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
HTTP request handlers for account and device verification operations. Process verification code validation, resend requests, and device verification flows to ensure account and device authenticity.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all verification controllers |
| resend-verification.controller.js | Handles verification code resend requests |
| verification.controller.js | Processes verification code validation |

## 🔗 Key Files
- **verification.controller.js**: Handles POST /verify for validating verification codes (email/device)
- **resend-verification.controller.js**: Processes POST /verify/resend for regenerating and resending codes
- **index.js**: Module exports for verification controllers

## 📝 Usage Notes
- Verification required for new accounts before full access
- Device verification triggers on unrecognized device logins
- Rate limiting applied to prevent code resend abuse
- Verification codes are time-limited and single-use
- Supports both email and SMS verification channels
- Failed verification attempts are logged for security
- Used by verification routers to handle verification flow
