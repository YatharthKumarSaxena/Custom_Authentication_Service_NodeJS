const RateLimitStoreModel = require("../models/rate-limit.model");

// Default values — tune them as needed
const REQUEST_LIMIT = 5;
const TIME_WINDOW_MS = 60 * 1000; // 1 minute

exports.getRateLimitMeta = async (deviceID, routeKey) => {
    const record = await RateLimitStoreModel.findOne({ deviceID, routeKey });
    if (record) return record;
    return { requestCount: 0, lastRequestAt: 0 };
};

exports.shouldBlockRequest = (requestCount, lastRequestAt) => {
    const now = Date.now();
    return (
        requestCount >= REQUEST_LIMIT &&
        now - lastRequestAt < TIME_WINDOW_MS
    );
};

exports.incrementRateLimitCount = async (deviceID, routeKey) => {
    const now = Date.now();
    await RateLimitStoreModel.findOneAndUpdate(
        { deviceID, routeKey },
        {
            $inc: { requestCount: 1 },
            $set: { lastRequestAt: now },
        },
        { upsert: true }
    );
};
