// 🛡️ utils/rateLimiter.factory.js
const { errorMessage, throwInternalServerError, throwResourceNotFoundError, getLogIdentifiers } = require("../configs/error-handler.configs");
const { logWithTime } = require("../utils/time-stamps.utils");
const UserModel = require("../models/user.model");
const DeviceRateLimit = require("../models/device-rate-limit.model");
const { TOO_MANY_REQUESTS, NOT_FOUND } = require("../configs/http-status.config");

/* Factory Design Pattern is used here to create rate limiters based on Different APIs*/

const createRateLimiter = (maxRequests, timeWindowInMs) => {
  return async (req, res, next) => {
    try {
      const userID = req.user?.userID || req.body?.userID || req.query?.userID;
      const deviceID = req.deviceID;

      if (!userID || !deviceID) {
        logWithTime(`Either UserID or device ID is not provided by User`);
        return throwResourceNotFoundError(res,"userID or deviceID (for rate limiting).")
      }

      let user = req.user;
      if(!user) user = await UserModel.findOne({ userID });

      if (!user) {
        logWithTime(`Unauthorized User is provided from device with device id: (${req.deviceID})`);
        return res.status(NOT_FOUND).json({ message: "User not found." });
      }

      const device = user.devices.info.find(d => d.deviceID === deviceID);
      if (!device) {
        logWithTime(`User (${user.userID}) is doing action from invalid device id: (${req.deviceID})`);
        return res.status(NOT_FOUND).json({ message: "Device not registered." });
      }

      const now = Date.now();
      const lastRequestAt = device.lastUsedAt?.getTime() || 0;
      const timeDiff = now - lastRequestAt;

      if (timeDiff > timeWindowInMs) {
        // 🧼 Reset the count
        logWithTime(`🔄 Rate limit reset for userID: ${userID} on deviceID: ${deviceID} by User with Device Based Rate Limiter`);
        device.lastUsedAt = new Date(now);
        device.requestCount = 1;
      } else {
        if (device.requestCount >= maxRequests) {
          const resetInSec = Math.ceil((timeWindowInMs - timeDiff) / 1000);
          logWithTime(`🚫 Rate limit exceeded for userID: ${userID} on deviceID: ${deviceID}`);
          res.setHeader("Retry-After", resetInSec); // standard rate-limiting header
          return res.status(TOO_MANY_REQUESTS).json({
            message: "Too many requests. Please try again later.",
            retryAfter: `(${resetInSec}) seconds`
          });
        }
        device.requestCount += 1;
      }
      
      const remaining = maxRequests - device.requestCount;
      const resetInSec = Math.ceil((timeWindowInMs - timeDiff) / 1000);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining >= 0 ? remaining : 0);
      res.setHeader("X-RateLimit-Reset", resetInSec > 0 ? resetInSec : 0);

      await user.save();
      if (!res.headersSent)return next();
    } catch (err) {
      const getIdentifiers = getLogIdentifiers(req);
      logWithTime(`❌ An Internal Error Occurred while checking the rate limit of device ${getIdentifiers}`);
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
        return throwResourceNotFoundError(res,"Device ID (required for rate limiting).")
      }

      let record = await DeviceRateLimit.findOne({ deviceID });

      const now = Date.now();

      if (!record) {
        // 🆕 First time attempt from this device
        logWithTime(`🔄 Device Based rate Limiter created Rate Limiter for deviceID: ${deviceID}`);
        record = await DeviceRateLimit.create({
          deviceID: deviceID
        });
        if (!res.headersSent)return next();
      }

      const timeSinceLastAttempt = now - new Date(record.lastAttemptAt).getTime();

      if (timeSinceLastAttempt > timeWindowInMs) {
        // 🔄 Reset attempts if window expired
        logWithTime(`🔄 Rate limit reset for deviceID: ${deviceID} by Device Based Rate Limiter`);
        record.attempts = 1;
        record.lastAttemptAt = now;
        await record.save();
        if (!res.headersSent)return next();
      }

      if (record.attempts >= maxRequests) {
        const resetInSec = Math.ceil((timeWindowInMs - timeSinceLastAttempt) / 1000);
        logWithTime(`🚫 Too many attempts from device: ${deviceID}`);
        res.setHeader("Retry-After", resetInSec); // standard rate-limiting header
        return res.status(TOO_MANY_REQUESTS).json({
          message: "Too many attempts. Please try again later.",
          retryAfter: `${Math.ceil((timeWindowInMs - timeSinceLastAttempt)/1000)} seconds`
        });
      }

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - record.attempts);
      res.setHeader("X-RateLimit-Reset", Math.ceil((timeWindowInMs - timeSinceLastAttempt) / 1000));

      // 🔁 Increment attempts and continue
      record.attempts += 1;
      record.lastAttemptAt = now;
      await record.save();
      if (!res.headersSent)return next();

    } catch (err) {
      const getIdentifiers = getLogIdentifiers(req);
      logWithTime(`❌ An Internal Error Occurred while checking the rate limit of device ${getIdentifiers}`);
      errorMessage(err);
      if (!res.headersSent)return throwInternalServerError(res);
    }
  }
};

module.exports = {
  createRateLimiter: createRateLimiter,
  createDeviceBasedRateLimiter: createDeviceBasedRateLimiter
};
