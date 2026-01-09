// utils/redis-client.util.js
const Redis = require("ioredis");
const { errorMessage } = require("@utils/error-handler.util");
const { logWithTime } = require("@utils/time-stamps.util");
const { redis } = require("@configs/redis.config");

const redisClient = new Redis({
  host: redis.host,
  port: redis.port,
  password: redis.password,
  db: redis.db,
  retryStrategy(times) {
    if (times > redis.maxRetryAttempts) {
      logWithTime("❌ Redis connection failed after max retries. Exiting...");
      process.exit(1);
    }
    return Math.min(times * redis.retryInitialDelayMs, redis.retryMaxDelayMs);
  }
});

redisClient.on("connect", () => {
  logWithTime("✅ Redis connected successfully");
});

redisClient.on("error", (error) => {
  logWithTime("❌ Redis connection error");
  errorMessage(error);
});

module.exports = { redisClient };