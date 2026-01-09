const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const OTP_PURPOSE = [
  "SIGNUP",
  "FORGOT_PASSWORD",
  "EMAIL_VERIFICATION",
  "PHONE_VERIFICATION",
  "DEVICE_VERIFICATION"
];

const otpSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: "User",
    default: null,
    index: true
  },

  deviceId: {
    type: ObjectId,
    ref: "Device",
    default: null,
    index: true
  },

  contact: {
    type: String, // email or fullPhoneNumber
    required: true,
    index: true
  },

  purpose: {
    type: String,
    enum: OTP_PURPOSE,
    required: true
  },

  otpHash: {
    type: String,
    required: true,
    select: false
  },

  expiresAt: {
    type: Date,
    required: true
  },

  attemptCount: {
    type: Number,
    default: 0
  },

  maxAttempts: {
    type: Number,
    default: 5
  },

  isUsed: {
    type: Boolean,
    default: false
  }

}, { timestamps: true, versionKey: false });

/* 🔥 Auto-delete OTP after expiry */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
