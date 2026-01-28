# 📁 Audit Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Provides comprehensive audit logging capabilities for authentication and authorization events. Tracks user activities, security events, and system operations for compliance and security monitoring.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all audit services |
| auth-audit.service.js | Logs authentication and authorization events |

## 🔗 Key Files
- **auth-audit.service.js**: Records authentication attempts, session activities, and security events with timestamps and metadata
- **index.js**: Module exports for audit services

## 📝 Usage Notes
- Automatically logs all authentication events (sign-in, sign-out, etc.)
- Records failed authentication attempts for security monitoring
- Maintains audit trail for compliance requirements
- Includes metadata like IP address, device info, and timestamps
- Used throughout authentication flows for activity tracking
- Critical for security incident investigation and compliance audits
