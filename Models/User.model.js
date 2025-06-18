const mongoose = require("mongoose");

/* User Schema */

/*
 * Name
 * User_ID
 * Password
 * Email_ID
 * User Type
 * Address [localAddress,city,pincode,state,country]
 * Phone Number
 * isVerified
 * isActive
 * isBlocked
 * UserType
 * lastLogin
 * dateOfBirth
 * gender
 * profilePicUrl
 * jwtTokenIssuedAt
 * refreshToken
*/

// Defined Document Structure of a User
const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    phoneNumber:{
        type: String,
        match: /^[0-9]{10}$/,
        required: true,
        unique: true
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
        // At least one character before @
        // Exactly one @ symbol
        // At least one character before and after the . in domain
        // No spaces allowed
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // simple regex for basic email format
    },
    address:[
        {
            _id: false,
            type: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
            localAddress:{
                type: String,
                required: false
            },
            city:{
                type: String,
                required: false
            },
            pincode:{
                type: String,
                required: false
            },
            state:{
                type: String,
                required: false
            },
            country:{
                type: String,
                required: false
            }
        }
    ],
    dateOfBirth:{
        type: Date,
        default: null
    },
    gender:{
        type: String,
        enum: ["Female","Male","Others"],
        default: null
    },
    profilePicUrl: {
        type: String,
        default: null
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
        enum: ["Customer","Admin"],
        default: "Customer"
    },
    lastLogin:{
        type: Date,
    },
    refreshToken: {
        type: String, // Stores Refresh Token (For SignOut Purpose)
        default: null
    },
    jwtTokenIssuedAt: {
        type: Date,
        default: null
    },
    loginCount: {
        type: Number,
        default: 0 // Useful for analytics and login alerts
    },
    blockReason: {
        type: String,
        default: null
    },
    devices: [
        {
             _id: false,
            deviceID: { type: String, required: true }, // e.g. generated UUID
            deviceName: { type: String }, // e.g. Redmi Note 8, Chrome on Mac
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
    passwordChangedAt: {
        type: Date,
        default: null
    },
    lastDeactivatedAt: { 
        type: Date,
        default: null
    }
},{timestamps:true,versionKey:false})

// Creating a Collection named Users that will Include User Documents / Records
// module.exports convert the whole file into a Module
module.exports = mongoose.model("User",userSchema); 
// By Default Mongoose Convert User into Plural Form i.e Users