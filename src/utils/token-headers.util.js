// utils/token-headers.util.js
const buildAccessTokenHeaders = (accessToken) => ({
    "x-access-token": accessToken,
    "x-token-refreshed": "true",
    "Access-Control-Expose-Headers": "x-access-token, x-token-refreshed"
});

module.exports = { buildAccessTokenHeaders };
