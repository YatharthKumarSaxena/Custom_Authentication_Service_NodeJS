const { deviceBasedRateLimiters } = require("@rate-limiters/device-based.rate-limiter");
const { logWithTime } = require("@utils/time-stamps.util");
const { BAD_REQUEST } = require("@configs/http-status.config");
const { malformedAndWrongRequestRateLimiter } = deviceBasedRateLimiters;

const malformedJsonHandler = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === BAD_REQUEST && "body" in err) {
    logWithTime(`❌ Malformed JSON in ${req.method} ${req.originalUrl}`);

    return malformedAndWrongRequestRateLimiter(req, res, () => {
      return res.status(BAD_REQUEST).json({
        code: "MALFORMED_JSON",
        message: "Invalid JSON syntax in request body"
      });
    });
  }
  next(err);
};

module.exports = { malformedJsonHandler };