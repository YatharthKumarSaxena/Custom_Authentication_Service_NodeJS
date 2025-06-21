const mongoose = require("mongoose");
const AUTH_LOG_EVENTS = require("../configs/auth-log-events.config");
const { DEVICE_TYPES } = require("../configs/user-enums.config");

const authLogSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: AUTH_LOG_EVENTS,
    required: true
  },
  deviceID: {
    type: String,
    required: true
  },
  deviceName: {
    type: String
  },
  deviceType: {
    type: String,
    enum: DEVICE_TYPES,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  performedBy: {
    type: String,
    enum: ["CUSTOMER", "ADMIN"],
    default: "CUSTOMER"
  },
  adminActions: {
    targetUserID:{
      type: String
    },
    filter:{
      type: [String],
      enum: AUTH_LOG_EVENTS
    },
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("AuthLog", authLogSchema);
