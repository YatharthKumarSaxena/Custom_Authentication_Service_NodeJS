const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("@utils/redis-client.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { errorMessage, throwInternalServerError, throwTooManyRequestsError } = require("@/responses/common/error-handler.response");

function createGlobalLimiter() {
    try {
        return rateLimit({
            store: new RedisStore({
                sendCommand: (...args) => redisClient.call(...args)
            }),
            // Default: 10 mins window
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 600000, 
            // Default: 100 requests per IP
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            
            message: {
                message: "Too many requests. Please try again after some time.",
            },
            
            standardHeaders: true,
            legacyHeaders: false,

            // UPDATED HANDLER
            handler: (req, res, next, options) => {
                try {
                    const ip = req.ip || req.headers["x-forwarded-for"] || "UNKNOWN_IP";
                    const path = req.originalUrl;
                    
                    // 1. Calculate Retry Time
                    const resetTime = req.rateLimit?.resetTime;
                    const retryAfterSeconds = resetTime
                        ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
                        : null;

                    // 2. Logging
                    logWithTime(`🚫 Global Rate Limit Triggered | IP: ${ip} | Path: ${path}`);
                    
                    // 3. Use Standard Error Handler
                    return throwTooManyRequestsError(res, options.message.message, retryAfterSeconds);

                } catch (err) {
                    errorMessage(err);
                    // Fallback agar handler ke andar crash ho jaye
                    return res.status(500).json({ 
                        success: false, 
                        message: "Internal Server Error in Global Limiter" 
                    });
                }
            }
        });
    } catch (err) {
        // Agar Redis connect hone se pehle hi crash ho jaye
        errorMessage(err);
        return (req, res, next) => {
            throwInternalServerError(res, err);
        };
    }
}

const globalLimiter = createGlobalLimiter();

module.exports = { globalLimiter };