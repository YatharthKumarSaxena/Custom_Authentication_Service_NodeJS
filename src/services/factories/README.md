# 📁 Factory Services

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Provides factory pattern implementations for creating and managing notification services. Centralizes the creation logic for different notification channels (email, SMS) with a unified interface.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all factory services for external use |
| notification.factory.js | Factory for creating notification service instances based on channel type |

## 🔗 Key Files
- **notification.factory.js**: Creates appropriate notification service (email/SMS) based on the requested channel, providing a unified interface for sending notifications
- **index.js**: Module exports for easy importing of factory services

## 📝 Usage Notes
- Implements the Factory design pattern for notification service creation
- Abstracts the complexity of selecting and initializing the correct notification channel
- Provides a single point of configuration for all notification types
- Used throughout the application when sending verification codes, alerts, or notifications
