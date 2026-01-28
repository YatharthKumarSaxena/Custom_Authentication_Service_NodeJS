const { AuthModes, RequestLocation } = require("@configs/enums.config");
const { authMode } = require("@configs/security.config");
const { logWithTime } = require("@utils/time-stamps.util");

const sanitizeAuthPayload = (location = RequestLocation.BODY) => {
  return (req, res, next) => {
    const payload = req[location];
    if (!payload) return next();

    let { email, countryCode, localNumber } = payload;

    // Basic trimming
    if (typeof email === "string") payload.email = email.trim().toLowerCase();
    if (typeof countryCode === "string") payload.countryCode = countryCode.trim();
    if (typeof localNumber === "string") payload.localNumber = localNumber.trim();

    switch (authMode) {

      case AuthModes.EMAIL:
        if (payload.countryCode) {
          logWithTime(
            `🧹 Sanitized country code field in EMAIL auth mode | device: ${req.device?.deviceUUID}`
          );
        }
        if (payload.localNumber) {
          logWithTime(
            `🧹 Sanitized local number field in EMAIL auth mode | device: ${req.device?.deviceUUID}`
          );
        }
        delete payload.countryCode;
        delete payload.localNumber;
        break;

      case AuthModes.PHONE:
        if (payload.email) {
          logWithTime(
            `🧹 Sanitized email field in PHONE auth mode | device: ${req.device?.deviceUUID}`
          );
        }
        delete payload.email;
        break;

      case AuthModes.BOTH:
        // Nothing removed
        break;

      case AuthModes.EITHER:
        // nothing here — validation will decide correctness
        break;

      default:
        break;
    }

    logWithTime("✅ Auth payload sanitization completed");
    return next();
  };
};

module.exports = { sanitizeAuthPayload };
