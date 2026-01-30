module.exports = {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0,
    maxRetryAttempts: parseInt(process.env.REDIS_MAX_RETRY_ATTEMPTS) || 10,
    retryInitialDelayMs: parseInt(process.env.REDIS_RETRY_INITIAL_DELAY) || 100,
    retryMaxDelayMs: parseInt(process.env.REDIS_RETRY_MAX_DELAY) || 2000
  }
};