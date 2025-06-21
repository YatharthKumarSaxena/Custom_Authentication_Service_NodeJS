// 🛡️ utils/rateLimiter.factory.js
const { errorMessage, throwInternalServerError } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");
const DeviceRateLimit = require("../models/device-rate-limit.model");

/* Factory Design Pattern is used here to create rate limiters based on Different APIs*/

const createRateLimiter = (maxRequests, timeWindowInMs) => {
  return async (req, res, next) => {
    try {
      const userID = req.user?.userID || req.body?.userID || req.query?.userID;
      const deviceID = req.deviceID;

      if (!userID || !deviceID) {
        logWithTime(`Either UserID or device ID is not provided by User`);
        return res.status(400).json({
          message: "Missing userID or deviceID for rate limiting."
        });
      }

      let user = req.user;
      if(!user) user = await UserModel.findOne({ userID });

      if (!user) {
        logWithTime(`Unauthorized User is provided from device with device id: (${req.deviceID})`);
        return res.status(404).json({ message: "User not found." });
      }

      const device = user.devices.find(d => d.deviceID === deviceID);
      if (!device) {
        logWithTime(`User (${user.userID}) is doing action from invalid decice id: (${req.deviceID})`);
        return res.status(404).json({ message: "Device not registered." });
      }

      const now = Date.now();
      const lastRequestAt = device.lastUsedAt?.getTime() || 0;
      const timeDiff = now - lastRequestAt;

      if (timeDiff > timeWindowInMs) {
        // 🧼 Reset the count
        device.lastUsedAt = new Date(now);
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
      if (!res.headersSent)return next();
    } catch (err) {
      const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
      logWithTime(`❌ An Internal Error Occurred while checking the rate limit of device of the User (${userID}) from device ID: (${req.deviceID})`);
      errorMessage(err);
      if (!res.headersSent)return throwInternalServerError(res);
    }
  };
};

const createDeviceBasedRateLimiter = (maxRequests, timeWindowInMs) => {
  return async (req, res, next) => {
    try {
      const deviceID = req.deviceID;

      if (!deviceID) {
        logWithTime("User has not provided device id");
        return res.status(400).json({
          message: "Device ID is required for rate limiting."
        });
      }

      let record = await DeviceRateLimit.findOne({ deviceID });

      const now = Date.now();

      if (!record) {
        // 🆕 First time attempt from this device
        record = await DeviceRateLimit.create({
          deviceID: deviceID
        });
        if (!res.headersSent)return next();
      }

      const timeSinceLastAttempt = now - new Date(record.lastAttemptAt).getTime();

      if (timeSinceLastAttempt > timeWindowInMs) {
        // 🔄 Reset attempts if window expired
        record.attempts = 1;
        record.lastAttemptAt = now;
        await record.save();
        if (!res.headersSent)return next();
      }

      if (record.attempts >= maxRequests) {
        logWithTime(`🚫 Too many sign-up attempts from device: ${deviceID}`);
        return res.status(429).json({
          message: "Too many sign-up attempts. Please try again later.",
          retryAfter: `${Math.ceil((timeWindowInMs - timeSinceLastAttempt)/1000)} seconds`
        });
      }

      // 🔁 Increment attempts and continue
      record.attempts += 1;
      record.lastAttemptAt = now;
      await record.save();
      if (!res.headersSent)return next();

    } catch (err) {
      const userID = req?.foundUser?.userID || req?.user?.userID || "UNKNOWN_USER";
      logWithTime(`❌ An Internal Error Occurred while checking the rate limit of device of the User (${userID}) from device ID: (${req.deviceID})`);
      errorMessage(err);
      if (!res.headersSent)return throwInternalServerError(res);
    }
  }
};

module.exports = {
  createRateLimiter: createRateLimiter,
  createDeviceBasedRateLimiter: createDeviceBasedRateLimiter
};
