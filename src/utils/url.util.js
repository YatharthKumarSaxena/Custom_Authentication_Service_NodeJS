// utils/url.util.js

const getFrontendUrl = (routePath, queryParams = {}) => {
    // 1. Base URL uthao
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    
    // 2. URL Object banao (Ye automatic slash / handling karta hai)
    // Example: Base(http://localhost:3000) + Path(/reset-password)
    const url = new URL(routePath, baseUrl);
    
    // 3. Query Params Loop karke add karo
    // Isse '?token=abc' manually likhne ki zaroorat nahi
    Object.keys(queryParams).forEach(key => {
        if (queryParams[key]) {
            url.searchParams.append(key, queryParams[key]);
        }
    });

    return url.toString();
};

module.exports = { getFrontendUrl };