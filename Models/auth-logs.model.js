const mongoose = require("mongoose");

const authLogSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ["LOGIN", "LOGOUT_ALL_DEVICE", "ACTIVATE", "DEACTIVATE", "BLOCKED", "UNBLOCKED", "CHANGED_PASSWORD", "REGISTER", "LOGOUT_SPECIFIC_DEVICE", "CHECK_AUTH_LOGS"],
    required: true
  },
  deviceID: {
    type: String,
    required: true
  },
  deviceName: {
    type: String
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
      enum: ["LOGIN", "LOGOUT_ALL_DEVICE", "ACTIVATE", "DEACTIVATE", "BLOCKED", "UNBLOCKED", "CHANGED_PASSWORD", "REGISTER", "LOGOUT_SPECIFIC_DEVICE", "CHECK_AUTH_LOGS", "GET_ACTIVE_DEVICES_LOG", "ACCESS_TOKEN", "REFRESH_TOKEN"]
    },
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("AuthLog", authLogSchema);
