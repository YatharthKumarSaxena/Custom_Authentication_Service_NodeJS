// utils/redis-client.util.js
const Redis = require("ioredis");
const { errorMessage } = require("@/responses/common/error-handler.response");
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

/**
 * Get Redis client instance
 * @returns {Redis} Redis client instance
 * @throws {Error} If Redis client is not initialized
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis client not initialized");
  }
  return redisClient;
};

module.exports = { 
  redisClient,
  getRedisClient 
};