const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const { LinkPurpose } = require("@configs/enums.config");

const verificationLinkSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  deviceId: {
    type: ObjectId,
    ref: "Device",
    default: null
  },

  contact: {
    type: String, // email or phone
    required: true,
    index: true
  },

  purpose: {
    type: String,
    enum: Object.values(LinkPurpose),
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
  VerificationLinkModel: mongoose.model("VerificationLink", verificationLinkSchema)
};
