/**
 * Access Token Utility
 * 
 * Utility functions for managing access token headers in HTTP responses.
 * Provides consistent interface for setting, clearing, and extracting access tokens.
 * 
 * @author Custom Auth Service Team
 * @date 2026-03-06
 */

const { extractAccessToken: extractToken } = require("@/utils/extract-token.util");

/**
 * Set access token in response headers
 * @param {Response} res - Express response object
 * @param {string} accessToken - JWT access token
 */
const setAccessTokenHeaders = (res, accessToken) => {
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-token-refreshed", "true");
    res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
};

/**
 * Clear access token headers from response
 * @param {Response} res - Express response object
 */
const clearAccessTokenHeaders = (res) => {
    res.setHeader("x-access-token", "");
    res.setHeader("x-token-refreshed", "false");
    res.setHeader("Access-Control-Expose-Headers", "x-access-token, x-token-refreshed");
};

/**
 * Extract access token from request
 * @param {Request} req - Express request object
 * @returns {string|null} Access token or null if not found
 */
const extractAccessToken = (req) => {
    return extractToken(req);
};

module.exports = {
    setAccessTokenHeaders,
    clearAccessTokenHeaders,
    extractAccessToken
};
