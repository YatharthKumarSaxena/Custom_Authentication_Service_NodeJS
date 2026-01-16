const mongoose = require("mongoose");
const { UserTypes, AuthModes, FirstNameFieldSetting } = require("@configs/enums.config");
const { authMode, FIRST_NAME_SETTING } = require("@configs/security.config");
const {
    localNumberLength,
    emailLength,
    firstNameLength,
    countryCodeLength,
    phoneNumberLength
} = require("@configs/fields-length.config");
const {
    emailRegex,
    phoneNumberRegex,
    userIdRegex,
    firstNameRegex,
    localNumberRegex,
    countryCodeRegex
} = require("@configs/regex.config");
const { DB_COLLECTIONS } = require("@configs/db-collections.config");

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
        minlength: firstNameLength.min,
        maxlength: firstNameLength.max,
        match: firstNameRegex,
        default: null
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
        match: localNumberRegex,
        sparse: true
    },

    phone: {
        type: String,
        trim: true,
        minlength: phoneNumberLength.min,
        maxlength: phoneNumberLength.max,
        match: phoneNumberRegex,
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
    twoFactorDisabledAt: { type: Date, default: null }

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

userSchema.pre("validate", function (next) {
    
    // 1. Handle DISABLED Case
    if (FIRST_NAME_SETTING === FirstNameFieldSetting.DISABLED) {
        // Agar disabled hai, toh value ko undefined kar do (Mongoose save nahi karega)
        this.firstName = undefined;
    }
    
    // 2. Handle MANDATORY Case
    else if (FIRST_NAME_SETTING === FirstNameFieldSetting.MANDATORY) {
        // Check if value exists and is not empty
        if (!this.firstName || (typeof this.firstName === 'string' && this.firstName.trim().length === 0)) {
            // Manually trigger Mongoose validation error
            this.invalidate("firstName", "First Name is required as per configuration.");
        }
    }
    
    // 3. Handle OPTIONAL Case
    // Do nothing, as firstName is already optional by schema definition

    next();
});

/* ------------------ 📦 Export ------------------ */

module.exports = {
    UserModel: mongoose.model(DB_COLLECTIONS.USER, userSchema)
};
