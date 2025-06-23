const mongoose = require("mongoose");
const { USER_TYPE,UNBLOCK_VIA,BLOCK_VIA,DEVICE_TYPES } = require("../configs/user-enums.config");
const { BLOCK_REASONS,UNBLOCK_REASONS } = require("../configs/user-id.config")
const { phoneRegex, emailRegex } = require("../configs/regex.config");

/* User Schema */

/*
 * Name
 * User_ID
 * Password
 * Email_ID
 * User Type
 * Phone Number
 * isVerified
 * isActive
 * isBlocked
 * blockedBy
 * unblockedBy
 * blockedAt
 * unblockedAt
 * blockVia
 * unblockVia
 * blockReason
 * unblockReason
 * blockCount
 * unblockCount
 * lastLogin
 * lastLogout
 * lastActivatedAt
 * lastDeactivatedAt
 * devices [deviceID,deviceName,requestCount,addedAt,lastUsedAt]
 * otp [code,expiresAt,verified,resendCount]
 * passwordChangedAt
 * jwtTokenIssuedAt
 * refreshToken
*/

// Defined Document Structure of a User
const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true,
    },
    phoneNumber:{
        type: String,
        match: phoneRegex,
        required: true,
        unique: true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
        minlength: 8 // strong password practice
    },
    userID:{
        type: String,
        unique: true,
        index: true // Perfect for performance in token-based auth.
    },
    emailID:{
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        // At least one character before @
        // Exactly one @ symbol
        // At least one character before and after the . in domain
        // No spaces allowed
        match: emailRegex // simple regex for basic email format
    },
    isActive:{ // This is controlled by Users only (For Soft Delete Account Purposes)
        type: Boolean,
        default: true
    },
    isBlocked:{ // This is controlled by Admins Only
        type: Boolean,
        default: false
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    userType:{
        type: String,
        enum: USER_TYPE,
        default: "CUSTOMER"
    },
    refreshToken: {
        type: String, // Stores Refresh Token (For SignOut Purpose)
        default: null
    },
    loginCount: {
        type: Number,
        default: 0 // Useful for analytics and login alerts
    },
    blockReason: {
        type: String,
        enum: BLOCK_REASONS,
        default: null
    },
    blockedBy : {
        type: String,
        default: null
    },
    blockedVia: {
        type: String,
        enum: BLOCK_VIA,
        default: null
    },
    blockCount: { 
        type: Number, 
        default: 0 
    },
    unblockReason: {
        type: String,
        enum: UNBLOCK_REASONS,
        default: null
    },
    unblockedBy: {
        type: String,
        default: null
    },
    unblockedVia: {
        type: String,
        enum: UNBLOCK_VIA,
        default: null
    },
    unblockCount: { 
        type: Number, 
        default: 0 
    },
    devices: [
        {
             _id: false,
            deviceID: { type: String, required: true, index: true}, // e.g. generated UUID
            deviceName: { type: String }, // e.g. Redmi Note 8, Chrome on Mac
            deviceType: {type: String, enum: DEVICE_TYPES, default: null},
            requestCount: {type: Number, default: 1},
            addedAt: { type: Date, default: Date.now },
            lastUsedAt: { type: Date, default: Date.now }
        }
    ],
    otp: {
        code: { type: String }, // 6-digit OTP (hashed ideally)
        expiresAt: { type: Date },
        verified: { type: Boolean, default: false },
        resendCount: { type: Number, default: 0 } // Limit OTP abuse
    },
    lastLogin:{
        type: Date,
        default: null
    },
    lastLogout: {
        type: Date,
        default: null
    },
    jwtTokenIssuedAt: {
        type: Date,
        default: null
    },
    passwordChangedAt: {
        type: Date,
        default: null
    },
    blockedAt: {
        type: Date,
        default: null
    },
    unblockedAt: {
        type: Date,
        default: null
    },
    lastActivatedAt: {
        type: Date,
        default: null
    },
    lastDeactivatedAt: { 
        type: Date,
        default: null
    }
},{timestamps:true,versionKey:false});

// Creating a Collection named Users that will Include User Documents / Records
// module.exports convert the whole file into a Module
module.exports = mongoose.model("User",userSchema); 
// By Default Mongoose Convert User into Plural Form i.e Users