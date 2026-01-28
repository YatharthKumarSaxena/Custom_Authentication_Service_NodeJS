# 📁 Handler Middleware

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
Special error handler middleware for application-wide error scenarios. Handle malformed JSON requests, unknown routes, and other edge cases that occur before reaching route handlers.

## 📂 Folder Structure

| File | Description |
|------|-------------|
| index.js | Exports all handler middleware |
| malformed-json-handler.middleware.js | Handles malformed JSON parse errors |
| unknown-route-handler.middleware.js | Handles 404 for undefined routes |

## 🔗 Key Files
- **malformed-json-handler.middleware.js**: Catches JSON parsing errors and returns proper error response
- **unknown-route-handler.middleware.js**: Handles requests to undefined routes (404 Not Found)
- **index.js**: Module exports for handler middleware

## 📝 Usage Notes
- Applied at application level (app-wide middleware)
- Malformed JSON handler comes before route definitions
- Unknown route handler comes after all route definitions
- Provides user-friendly error messages for common issues
- Essential for proper API error handling and user experience
- Used in main app.js or server.js configuration
