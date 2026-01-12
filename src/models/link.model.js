const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { VerificationPurpose } = require("@configs/enums.config");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

const verificationLinkSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: DB_COLLECTIONS.USER,
    required: true,
    index: true
  },

  deviceId: {
    type: ObjectId,
    ref: DB_COLLECTIONS.DEVICE
  },

  contact: {
    type: String, // email or phone
    required: true,
    index: true
  },

  purpose: {
    type: String,
    enum: Object.values(VerificationPurpose),
    required: true
  },

  tokenHash: {
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

  isUsed: {
    type: Boolean,
    default: false
  }

}, { timestamps: true, versionKey: false });

/* 🔥 Auto delete after expiry */
verificationLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  VerificationLinkModel: mongoose.model(DB_COLLECTIONS.LINK, verificationLinkSchema)
};
