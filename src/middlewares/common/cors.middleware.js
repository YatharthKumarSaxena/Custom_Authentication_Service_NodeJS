// CORS Middleware - Handles cross-origin requests with credentials

const { OK } = require("@/configs/http-status.config");

const corsMiddleware = (req, res, next) => {
    // List of allowed origins
    const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL // Add from .env if needed
    ].filter(Boolean); // Remove undefined values

    const origin = req.headers.origin;
    const requestMethod = req.method;

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Handle preflight requests (OPTIONS method)
    if (requestMethod === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, X-Requested-With, x-access-token, x-token-refreshed, x-device-uuid, x-device-type, x-device-name, x-request-id"
        );
        res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
        
        return res.status(OK).end();
    }

    next();
};

module.exports = { corsMiddleware };