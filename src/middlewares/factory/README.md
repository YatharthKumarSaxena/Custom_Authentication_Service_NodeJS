# 📁 Factory Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Middleware factory functions that generate middleware instances based on configuration. Implement the Factory pattern for creating reusable, configurable middleware with different validation rules and behaviors.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all middleware factories |
| auth-mode-middleware.factory.js | Creates authentication mode validation middleware |
| fetch-entity.middleware-factory.js | Generates entity fetching middleware |
| field-validation.middleware-factory.js | Creates field validation middleware |
| sanitize-auth-payload.middleware.factory.js | Generates auth payload sanitization middleware |
| validate-request-body.middleware-factory.js | Creates request body validation middleware |

## 🔗 Key Files
- **field-validation.middleware-factory.js**: Generates validation middleware for different field sets and rules
- **validate-request-body.middleware-factory.js**: Creates request body validators with custom schemas
- **fetch-entity.middleware-factory.js**: Produces middleware for fetching different entity types
- **auth-mode-middleware.factory.js**: Generates middleware for different authentication modes
- **sanitize-auth-payload.middleware.factory.js**: Creates sanitization middleware for auth payloads
- **index.js**: Module exports for middleware factories

## 📝 Usage Notes
- Implements Factory design pattern for middleware creation
- Allows dynamic middleware generation with custom configurations
- Reduces code duplication by parameterizing middleware behavior
- Used to create route-specific middleware with different validation rules
- Provides flexibility and reusability across the application
- Called during router setup to create configured middleware instances
