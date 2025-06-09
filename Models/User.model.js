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
 * UserType
 * lastLogin
 * verificationToken
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
            localAddress:{
                type: String,
                required: true
            },
            city:{
                type: String,
                required: true
            },
            pincode:{
                type: String,
                required: true
            },
            state:{
                type: String,
                required: true
            },
            country:{
                type: String,
                required: true
            }
        }
    ],
    isActive:{
        type: Boolean,
        default: true
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
    verificationToken: {
        type: String // for OTP / email verification link
    }
},{timestamps:true,versionKey:false})

// Creating a Collection named Users that will Include User Documents / Records
// module.exports convert the whole file into a Module
module.exports = mongoose.model("User",userSchema); 
// By Default Mongoose Convert User into Plural Form i.e Users