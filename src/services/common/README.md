# 📁 Common Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Provides shared utility services used across multiple modules. Contains reusable functions for fetching entities and users, reducing code duplication and ensuring consistent data retrieval patterns.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all common utility services |
| fetch-entity.util.js | Generic utility for fetching database entities |
| fetch-user.util.js | Specialized utility for fetching user records |

## 🔗 Key Files
- **fetch-entity.util.js**: Provides generic methods for retrieving entities from the database with error handling
- **fetch-user.util.js**: Specialized methods for fetching user records with common query patterns
- **index.js**: Module exports for common services

## 📝 Usage Notes
- Used throughout the application for consistent data retrieval
- Implements standardized error handling and validation
- Reduces code duplication across services
- Provides type-safe entity fetching utilities
- Can be extended with additional common utilities as needed
