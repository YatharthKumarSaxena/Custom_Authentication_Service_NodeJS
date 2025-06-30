const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema({
  deviceID: { type: String, required: true },
  routeKey: { type: String, required: true },
  requestCount: { type: Number, default: 0 },
  lastRequestAt: { type: Number, default: 0 }
});

rateLimitSchema.index({ deviceID: 1, routeKey: 1 }, { unique: true });

module.exports = mongoose.model("RateLimitStore", rateLimitSchema);
