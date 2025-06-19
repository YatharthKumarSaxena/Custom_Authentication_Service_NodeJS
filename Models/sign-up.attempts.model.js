const mongoose = require("mongoose");

// 📌 Schema for tracking sign-up attempts by deviceID
const signUpAttemptsSchema = new mongoose.Schema({
    deviceID: {
        type: String,
        required: true,
        unique: true
    },
    attempts: {
        type: Number,
        default: 1
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true,versionKey: false});

module.exports = mongoose.model("signUpAttempt",signUpAttemptsSchema);