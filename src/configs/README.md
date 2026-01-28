# 📁 Configs

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains all configuration files for the authentication service. Each file defines constants, settings, and configuration parameters used throughout the application for database connections, security, validation, and various service features.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| admin-id.config.js | File | Admin user ID configuration |
| app-limits.config.js | File | Application-level limits and thresholds |
| auth-log-events.config.js | File | Authentication logging event definitions |
| cookies.config.js | File | Cookie settings and configuration |
| cron.config.js | File | Cron job schedules and settings |
| db-collections.config.js | File | Database collection names |
| db.config.js | File | Database connection configuration |
| device-headers.config.js | File | Device identification header mappings |
| email.config.js | File | Email service configuration |
| enums.config.js | File | Enumeration definitions used across the app |
| fields-length.config.js | File | Field length validation constraints |
| frontend-routes.config.js | File | Frontend route definitions |
| http-status.config.js | File | HTTP status code constants |
| id-prefixes.config.js | File | Prefix patterns for generated IDs |
| ip-address.config.js | File | IP address handling configuration |
| rate-limit.config.js | File | Rate limiting settings |
| redis.config.js | File | Redis connection and cache configuration |
| regex.config.js | File | Regular expression patterns for validation |
| required-fields.config.js | File | Required field definitions per endpoint |
| security.config.js | File | Security settings and encryption keys |
| server.config.js | File | Server port and environment settings |
| system-log-events.config.js | File | System logging event definitions |
| token.config.js | File | JWT token configuration |
| uri.config.js | File | URI and endpoint path definitions |
| validation-sets.config.js | File | Field validation rule sets |
| validation.config.js | File | General validation configuration |
| verification-mapping.config.js | File | Verification method mappings |

## 🔗 Key Files
- **db.config.js**: Database connection parameters and MongoDB setup
- **security.config.js**: Encryption keys, salting rounds, and security parameters
- **token.config.js**: JWT token expiration times and secret keys
- **server.config.js**: Server port, environment, and base URL configuration
- **rate-limit.config.js**: API rate limiting thresholds
- **redis.config.js**: Redis cache configuration
- **enums.config.js**: Centralized enumeration values used throughout the application

## 📝 Notes
- All configuration files are centralized here for easy maintenance
- Environment-specific values should be loaded from environment variables
- Modifying these files may require server restart
- Keep sensitive data (secrets, keys) in environment variables, not hardcoded
