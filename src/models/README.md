# 📁 Models

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains MongoDB schema definitions using Mongoose. Each model file defines the database structure, validation rules, and data relationships for different entities in the authentication service.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| auth-logs.model.js | File | Authentication activity logging schema |
| device.model.js | File | Device information and metadata schema |
| id-generator.model.js | File | Counter schema for generating sequential IDs |
| index.js | File | Central export file for all models |
| link.model.js | File | Magic link and verification link schema |
| otp.model.js | File | One-time password storage schema |
| system-log.model.js | File | System event logging schema |
| user-device.model.js | File | User-device association and session schema |
| user.model.js | File | User account information schema |

## 🔗 Key Files
- **user.model.js**: Core user schema with authentication credentials and profile data
- **user-device.model.js**: Manages user sessions and device associations
- **auth-logs.model.js**: Tracks all authentication events for security monitoring
- **otp.model.js**: Stores and validates one-time passwords for verification
- **link.model.js**: Handles magic links and email verification tokens
- **id-generator.model.js**: Generates unique sequential IDs with prefixes
- **index.js**: Exports all models for easy importing in other modules

## 📝 Notes
- All models use Mongoose ODM for MongoDB
- Models include built-in validation and middleware hooks
- Timestamps are automatically managed by Mongoose
- Index definitions are included for optimized queries
- Sensitive fields (passwords, tokens) are properly hashed or encrypted
