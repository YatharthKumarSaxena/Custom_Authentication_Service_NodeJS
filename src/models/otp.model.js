const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { OTP_Purpose, ContactModes } = require("@configs/enums.config");

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
    type: String,
    required: true,
    enum: Object.values(ContactModes),
    index: true
  },

  purpose: {
    type: String,
    enum: Object.values(OTP_Purpose),
    required: true
  },

  otpHash: {
    type: String,
    required: true,
    select: false
  },

  salt: {
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

module.exports = {
    OTPModel: mongoose.model("OTP", otpSchema)
};