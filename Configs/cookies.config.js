module.exports = {
    httpOnly: process.env.COOKIE_HTTP_ONLY === "true",   // Convert string to boolean
    secure: process.env.COOKIE_SECURE === "true",        // Convert string to boolean
    sameSite: process.env.COOKIE_SAME_SITE || "Lax",     // Default fallback
    domain: process.env.COOKIE_DOMAIN || "localhost"
};