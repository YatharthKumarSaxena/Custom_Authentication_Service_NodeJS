const mongoose = require("mongoose");
const { USER_TYPE,UNBLOCK_VIA,BLOCK_VIA,DEVICE_TYPES } = require("../configs/user-enums.config");
const { countryCodeLength, passwordLength, phoneNumberLength, nameLength, fullPhoneNumberLength, emailLength, deviceNameLength, otpLength } = require("../configs/fields-length.config");
const { BLOCK_REASONS,UNBLOCK_REASONS } = require("../configs/user-id.config")
const { numberRegex, emailRegex , nameRegex, countryCodeRegex, fullPhoneNumberRegex} = require("../configs/regex.config");

const deviceUniquenessValidator = {
  validator: function (deviceList) {
    const seen = new Set();
    return deviceList.every(d => {
      if (seen.has(d.deviceID)) return false;
      seen.add(d.deviceID);
      return true;
    });
  },
  message: 'Duplicate deviceID found in user\'s devices list.'
};

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
        minlength: nameLength.min,
        maxlength: nameLength.max,
        match: nameRegex,
        trim: true,
        default: null
    },
    phoneNumber:{
        countryCode: {
            type: String,
            required: true,
            trim: true,
            minlength: countryCodeLength.min,
            maxlength: countryCodeLength.max,
            match: countryCodeRegex
        },
        number: {
            type: String,
            required: true,
            trim: true,
            minlength: phoneNumberLength.min,
            maxlength: phoneNumberLength.max,
            match: numberRegex
        },
        _id: false
    },
    fullPhoneNumber: {
        type: String,
        unique: true,
        trim: true,
        index: true,
        required: true,
        match: fullPhoneNumberRegex,
        minlength: fullPhoneNumberLength.min,
        maxlength: fullPhoneNumberLength.max
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength: passwordLength.min,
        maxlength: passwordLength.max, 
        select: false
    },
    userID:{
        type: String,
        unique: true,
        immutable: true,
        index: true // Perfect for performance in token-based auth.
    },
    emailID:{
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        minlength: emailLength.min,
        maxlength: emailLength.max,
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
    devices: {
        info: {
            type: [{
                _id: false,
                deviceID: { type: String, required: true, index: true },
                deviceName: { type: String , minlength: deviceNameLength.min, maxlength: deviceNameLength.max},
                deviceType: { type: String, enum: DEVICE_TYPES, default: null },
                requestCount: { type: Number, default: 1 },
                addedAt: { type: Date, default: Date.now },
                lastUsedAt: { type: Date, default: Date.now }
            }],
            validate: deviceUniquenessValidator,
            default: []
        }
    },
    otp: {
        code: { type: String, minlength: otpLength.min, maxlength: otpLength.max }, // 6-digit OTP (hashed ideally)
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