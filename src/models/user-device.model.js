const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

const userDeviceSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: "User", required: true, index: true },
  deviceId: { type: ObjectId, ref: "Device", required: true, index: true },
  firstSeenAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: null },
  lastLogoutAt: { type: Date, default: null },
  // lastSeenAt: { type: Date, default: null },
  loginCount: { type: Number, default: 0 },
  twoFactorKey: { type: String, default: null, select: false },
  twoFactorKeyIssuedAt: { type: Date, default: null },
  failed2FAAttempts: { type: Number, default: 0 },
  twoFactorVerifiedAt: { type: Date, default: null },
  refreshToken: { type: String, default: null, select: false },
  jwtTokenIssuedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

// Ensure 1:1 user-device mapping
userDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = {
  UserDeviceModel: mongoose.model(DB_COLLECTIONS.USER_DEVICE, userDeviceSchema)
};