const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    deviceID: { type: String, required: true, unique: true },
    deviceName: { type: String, required: false },
    deviceType: { type: String, default: null },
    addedAt: { type: Date, default: Date.now },
    // lastUsedAt: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false },
    isTrusted: { type: Boolean, default: false }, // For Special Devices Like Admins
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("Device", deviceSchema);