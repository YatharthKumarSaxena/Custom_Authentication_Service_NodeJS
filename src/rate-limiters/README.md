# 📁 Rate Limiters

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains rate limiting middleware implementations that protect the API from abuse by limiting the number of requests a client can make within a time window. Different strategies are used based on endpoint sensitivity.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| create-redis-device.rate-limiter.js | File | Creates device-specific rate limiter using Redis |
| create.rate-limiter.js | File | Factory function for creating rate limiters |
| device-based.rate-limiter.js | File | Rate limiting based on device fingerprint |
| general-api.rate-limiter.js | File | Standard rate limiter for general API endpoints |
| global.rate-limiter.js | File | Global rate limiter for all requests |
| index.js | File | Exports all rate limiters |

## 🔗 Key Files
- **global.rate-limiter.js**: Applied to all requests for baseline protection
- **general-api.rate-limiter.js**: Used for most API endpoints
- **device-based.rate-limiter.js**: Tracks limits per device to prevent device-specific abuse
- **create-redis-device.rate-limiter.js**: Creates Redis-backed device limiters
- **create.rate-limiter.js**: Factory for creating custom rate limiter configurations
- **index.js**: Exports all limiters for use in routes

## 📝 Notes
- Rate limiters use Redis for distributed rate limiting
- Different endpoints have different limits based on sensitivity
- Device-based limiting prevents abuse from rotating IP addresses
- Limits are configurable in rate-limit.config.js
- Rate limiters respond with 429 Too Many Requests when exceeded
- Headers include rate limit info (X-RateLimit-Limit, X-RateLimit-Remaining)
- Consider implementing exponential backoff for repeated violations
