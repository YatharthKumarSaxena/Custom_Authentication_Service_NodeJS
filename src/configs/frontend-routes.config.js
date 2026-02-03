// configs/frontend-routes.config.js

const FRONTEND_ROUTES = {
    // Auth Routes
    RESET_PASSWORD: "/reset-password", // Ya "/auth/reset-password" agar frontend change kare
    VERIFY_EMAIL: "/verify-email",
    LOGIN: "/login",
    VERIFY_DEVICE: "/verify-device",
    // Other Routes
    DASHBOARD: "/dashboard",
    ACCOUNT_DETAILS: "/profile"
};

module.exports = { FRONTEND_ROUTES };