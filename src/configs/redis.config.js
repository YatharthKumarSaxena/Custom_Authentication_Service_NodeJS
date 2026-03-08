const { getMyEnv } = require("@/utils/env.util");

module.exports = {
  redis: {
    host: getMyEnv("REDIS_HOST", "127.0.0.1"),
    port: parseInt(getMyEnv("REDIS_PORT", 6379)),
    password: getMyEnv("REDIS_PASSWORD"),
    db: 0,
    maxRetryAttempts: parseInt(getMyEnv("REDIS_MAX_RETRY_ATTEMPTS", 10)),
    retryInitialDelayMs: parseInt(getMyEnv("REDIS_RETRY_INITIAL_DELAY", 100)),
    retryMaxDelayMs: parseInt(getMyEnv("REDIS_RETRY_MAX_DELAY", 2000))
  }
};