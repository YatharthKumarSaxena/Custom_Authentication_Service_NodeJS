// 🛡️ utils/rateLimiter.factory.js
const { errorMessage } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");

const createRateLimiter = (maxRequests, timeWindowInMs) => {
  return async (req, res, next) => {
    try {
      const userID = req.user?.userID || req.body?.userID || req.query?.userID;
      const deviceID = req.deviceID;

      if (!userID || !deviceID) {
        return res.status(400).json({
          message: "Missing userID or deviceID for rate limiting."
        });
      }

      const user = await UserModel.findOne({ userID });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const device = user.devices.find(d => d.deviceID === deviceID);
      if (!device) {
        return res.status(404).json({ message: "Device not registered." });
      }

      const now = Date.now();
      const lastRequestAt = device.lastRequestAt?.getTime() || 0;
      const timeDiff = now - lastRequestAt;

      if (timeDiff > timeWindowInMs) {
        // 🧼 Reset the count
        device.lastRequestAt = new Date(now);
        device.requestCount = 1;
      } else {
        if (device.requestCount >= maxRequests) {
          logWithTime(`🚫 Rate limit exceeded for userID: ${userID} on deviceID: ${deviceID}`);
          return res.status(429).json({
            message: "Too many requests. Please try again later.",
          });
        }
        device.requestCount += 1;
      }

      await user.save();
      return next();
    } catch (err) {
      errorMessage(err);
      return res.status(500).json({
        message: "Internal Server Error during rate limiting check.",
      });
    }
  };
};

module.exports = {
  createRateLimiter: createRateLimiter
};
