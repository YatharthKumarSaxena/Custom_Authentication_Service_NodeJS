const mongoose = require("mongoose");
const { USER_TYPE } = require("@configs/user-enums.config");
const { AuthModes } = require("@configs/enums.config");
const {
    passwordLength,
    fullPhoneNumberLength,
    emailLength,
    nameLength
} = require("@configs/fields-length.config");
const {
    emailRegex,
    fullPhoneNumberRegex,
    userIdRegex,
    nameRegex
} = require("@configs/regex.config");

/* ------------------ 👤 User Schema ------------------ */

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        immutable: true,
        unique: true,
        index: true,
        match: userIdRegex
    },

    name: {
        type: String,
        trim: true,
        minlength: nameLength.min,
        maxlength: nameLength.max,
        match: nameRegex,
        required: true
    },

    email: {
        type: String,
        lowercase: true,
        trim: true,
        minlength: emailLength.min,
        maxlength: emailLength.max,
        match: emailRegex,
        default: null,
        unique: true,
        sparse: true,
        index: true
    },

    fullPhoneNumber: {
        type: String,
        trim: true,
        minlength: fullPhoneNumberLength.min,
        maxlength: fullPhoneNumberLength.max,
        match: fullPhoneNumberRegex,
        default: null,
        unique: true,
        sparse: true,
        index: true
    },

    password: {
        type: String,
        minlength: passwordLength.min,
        maxlength: passwordLength.max,
        required: true,
        select: false
    },

    userType: {
        type: String,
        enum: Object.values(USER_TYPE),
        default: USER_TYPE.CUSTOMER
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    isActive: {          // User controlled (soft delete)
        type: Boolean,
        default: true
    },

    isBlocked: {         // Admin controlled
        type: Boolean,
        default: false
    },

    passwordChangedAt: {
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

}, { timestamps: true, versionKey: false });

/* ------------------ 🔐 Centralized AUTH_MODE Validation ------------------ */

userSchema.pre("validate", function (next) {
    const mode = process.env.AUTH_MODE;

    const hasEmail = !!this.email;
    const hasPhone = !!this.fullPhoneNumber;

    if (mode === AuthModes.EMAIL && !hasEmail) {
        return next(new Error("Email is required in EMAIL auth mode."));
    }

    if (mode === AuthModes.PHONE && !hasPhone) {
        return next(new Error("Phone number is required in PHONE auth mode."));
    }

    if (mode === AuthModes.BOTH && (!hasEmail || !hasPhone)) {
        return next(new Error("Both email and phone are required in BOTH auth mode."));
    }

    if (mode === AuthModes.EITHER) {
        if (!hasEmail && !hasPhone) {
            return next(new Error("Either email or phone is required in EITHER auth mode."));
        }
        if (hasEmail && hasPhone) {
            return next(new Error("Provide only one identifier (email OR phone) in EITHER auth mode."));
        }
    }

    next();
});

/* ------------------ 📦 Export ------------------ */

module.exports = {
    UserModel: mongoose.model("User", userSchema)
};
