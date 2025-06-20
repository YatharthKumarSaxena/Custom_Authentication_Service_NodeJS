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
    enum: ["USER", "ADMIN"],
    default: "USER"
  },
  checkAuthLogDetails: {
    adminID:{
      type: String
    },
    filter:{
      type: [String],
      enum: ["LOGIN", "LOGOUT_ALL_DEVICE", "ACTIVATE", "DEACTIVATE", "BLOCKED", "UNBLOCKED", "CHANGED_PASSWORD", "REGISTER", "LOGOUT_SPECIFIC_DEVICE", "CHECK_AUTH_LOGS"]
    }
  }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("AuthLog", authLogSchema);
