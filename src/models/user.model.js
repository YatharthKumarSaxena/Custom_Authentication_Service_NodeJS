const mongoose = require("mongoose");
const { UserTypes } = require("@configs/enums.config");
const { AuthModes } = require("@configs/enums.config");
const { authMode } = require("@configs/security.config");
const {
    localNumberLength,
    emailLength,
    nameLength,
    countryCodeLength,
    phoneNumberLength
} = require("@configs/fields-length.config");
const {
    emailRegex,
    phoneRegex,
    userIdRegex,
    nameRegex,
    numberRegex,
    countryCodeRegex
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

    firstName: {
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

    countryCode: {
        type: String,
        minlength: countryCodeLength.min,
        maxlength: countryCodeLength.max,
        default: null,
        match: countryCodeRegex,
        sparse: true
    },                 // e.g. "91"

    localNumber: {
        type: String,
        default: null,
        minlength: localNumberLength.min,
        maxlength: localNumberLength.max,
        match: numberRegex,
        sparse: true
    },

    phone: {
        type: String,
        trim: true,
        minlength: phoneNumberLength.min,
        maxlength: phoneLength.max,
        match: phoneRegex,
        default: null,
        unique: true,
        sparse: true,
        index: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    userType: {
        type: String,
        enum: Object.values(UserTypes),
        default: UserTypes.CUSTOMER
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
    },

    security: {
        changePassword: {
            failedAttempts: {
                type: Number,
                default: 0
            },
            lastAttemptAt: {
                type: Date,
                default: null
            }
        }
    },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorEnabledAt: { type: Date, default: null },

}, { timestamps: true, versionKey: false });

/* ------------------ 🔐 Centralized AUTH_MODE Validation ------------------ */

userSchema.pre("validate", function (next) {
    const mode = authMode;

    const hasEmail = !!this.email;
    const hasPhone = !!this.phone && !!this.localNumber && !!this.countryCode;

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
