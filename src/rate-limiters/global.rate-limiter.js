// middlewares/globalRateLimiter.js
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient } = require("@utils/redis-client.util");
const { errorMessage, throwInternalServerError } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");

function createGlobalLimiter() {
    try {
        return rateLimit({
            store: new RedisStore({
                sendCommand: (...args) => redisClient.call(...args)
            }),
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 600000,
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            message: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests. Please try again after some time.",
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res, next, options) => {
                const ip = req.ip;
                const path = req.originalUrl;
                const resetTime = req.rateLimit?.resetTime;
                const retryAfterSeconds = resetTime
                    ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
                    : null;

                logWithTime("🚫 Rate Limit Triggered");
                errorMessage(new Error("Rate limit exceeded"));

                return res.status(options.statusCode).json({
                    code: "RATE_LIMIT_EXCEEDED",
                    message: "Too many requests. Please try again later.",
                    ...(retryAfterSeconds && { retryAfterSeconds }),
                })
            }
        });
    } catch (err) {
        errorMessage(err);
        return (req, res, next) => {
            throwInternalServerError(res);
        };
    }
}

const globalLimiter = createGlobalLimiter();

module.exports = { globalLimiter };