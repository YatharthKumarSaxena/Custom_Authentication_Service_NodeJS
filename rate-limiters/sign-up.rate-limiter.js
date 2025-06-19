const SignUpAttempt = require("../models/signUpAttempt.model");
const { logWithTime } = require("../utils/time-stamps.utils");
const { errorMessage } = require("../configs/error-handler.configs");
const { perDevice } = require("../configs/rate-limit.config")


const MAX_ATTEMPTS = perDevice.signup.maxAttempts;
const TIME_WINDOW_MS = perDevice.signup.windowMs;

const signUpRateLimiter = async (req, res, next) => {
    try {
        const deviceID = req.deviceID;

        if (!deviceID) {
            return res.status(400).json({
                message: "Device ID is required for sign-up rate limiting."
            });
        }

        let record = await SignUpAttempt.findOne({ deviceID });

        const now = Date.now();

        if (!record) {
            // 🆕 First time attempt from this device
            record = await SignUpAttempt.create({
                deviceID: deviceID
            });
            return next();
        }

        const timeSinceLastAttempt = now - new Date(record.lastAttemptAt).getTime();

        if (timeSinceLastAttempt > TIME_WINDOW_MS) {
            // 🔄 Reset attempts if window expired
            record.attempts = 1;
            record.lastAttemptAt = now;
            await record.save();
            return next();
        }

        if (record.attempts >= MAX_ATTEMPTS) {
            logWithTime(`🚫 Too many sign-up attempts from device: ${deviceID}`);
            return res.status(429).json({
                message: "Too many sign-up attempts. Please try again later.",
                retryAfter: `${Math.ceil((TIME_WINDOW_MS - timeSinceLastAttempt)/1000)} seconds`
            });
        }

        // 🔁 Increment attempts and continue
        record.attempts += 1;
        record.lastAttemptAt = now;
        await record.save();
        return next();

    } catch (err) {
        logWithTime("❌ Error occurred during sign-up rate limiting.");
        errorMessage(err);
        return res.status(500).json({
            message: "Internal Server Error while checking sign-up rate limit.",
        });
    }
};

module.exports = {
    signUpRateLimiter: signUpRateLimiter
}
