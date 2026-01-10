const mongoose = require("mongoose");
const { AUTH_LOG_EVENTS }  = require("@configs/auth-log-events.config");
const { DeviceTypes } = require("@configs/enums.config");
const { UUID_V4_REGEX, userIdRegex } = require("@configs/regex.config");
const { deviceNameLength } = require("@configs/fields-length.config");

const authLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    match: userIdRegex,
    index: true
  },

  description: { 
    type: String, 
    default: null, 
    required: true 
  },

  oldData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  eventType: {
    type: String,
    enum: Object.values(AUTH_LOG_EVENTS),
    required: true
  },

  deviceID: {
    type: String,
    match: UUID_V4_REGEX,
    required: true
  },

  deviceName: {
    type: String,
    trim: true,
    minlength: deviceNameLength.min,
    maxlength: deviceNameLength.max,
    default: null
  },

  deviceType: {
    type: String,
    enum: Object.values(DeviceTypes),
    default: null
  }
}, { timestamps: true, versionKey: false });

module.exports = {
  AuthLogModel: mongoose.model("AuthLog", authLogSchema)
};