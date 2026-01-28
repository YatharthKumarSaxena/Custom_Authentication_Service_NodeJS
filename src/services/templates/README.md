# 📁 Template Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Contains template generators for email and SMS notifications. Provides formatted message templates for various authentication and account management operations with dynamic content injection.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all template services |
| emailTemplate.js | Email message templates and generators |
| smsTemplate.js | SMS message templates and generators |

## 🔗 Key Files
- **emailTemplate.js**: Generates HTML and text email templates for verification, password reset, notifications, etc.
- **smsTemplate.js**: Creates SMS message templates for OTP codes and alerts
- **index.js**: Module exports for template services

## 📝 Usage Notes
- Templates support dynamic content injection (user names, codes, links)
- Email templates include both HTML and plain text versions
- SMS templates are optimized for character limits
- Used by notification services (mail.service.js, sms.service.js)
- Centralizes all user-facing message content
- Easy to update messaging across the application
