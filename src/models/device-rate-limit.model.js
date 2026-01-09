const mongoose = require("mongoose");

// 📌 Schema for tracking sign-up attempts by deviceID
const deviceRateLimitSchema = new mongoose.Schema({
    deviceID: {
        type: String,
        required: true,
        unique: true
    },
    attempts: {
        type: Number,
        default: 1
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now,
        index: { expires: 86400 } // 86400 seconds = 24 hours
    }
},{timestamps: true,versionKey: false});

module.exports = mongoose.model("DeviceRateLimit",deviceRateLimitSchema);