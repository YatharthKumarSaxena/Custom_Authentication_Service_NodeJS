const mongoose = require("mongoose");
const { DeviceTypes } = require("@configs/enums.config");
const { UUID_V4_REGEX } = require("@configs/regex.config");
const { deviceNameLength } = require("@configs/fields-length.config");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

const deviceSchema = new mongoose.Schema({
    deviceUUID: { type: String, match: UUID_V4_REGEX, required: true, unique: true },
    deviceName: { type: String, minlength: deviceNameLength.min, maxlength: deviceNameLength.max, required: false },
    deviceType: { type: String, enum: Object.values(DeviceTypes), default: null },
    addedAt: { type: Date, default: Date.now },
    // lastUsedAt: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

module.exports = {
    DeviceModel: mongoose.model(DB_COLLECTIONS.DEVICE, deviceSchema)
};