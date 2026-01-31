const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { VerificationPurpose, ContactModes } = require("@configs/enums.config");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

const otpSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: DB_COLLECTIONS.USER,
    default: null,
    index: true
  },

  deviceId: {
    type: ObjectId,
    ref: DB_COLLECTIONS.DEVICE,
    index: true
  },

  purpose: {
    type: String,
    enum: Object.values(VerificationPurpose),
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

/* Auto-delete OTP after expiry */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
    OTPModel: mongoose.model(DB_COLLECTIONS.OTP, otpSchema)
};