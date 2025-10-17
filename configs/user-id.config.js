const bcryptjs = require("bcryptjs");
const adminPrefixes = require("./id-prefixes.config").adminIDPrefix;
const IP_Address_Code = require("./ip-address.config").IP_Address_Code;
const adminUserID = Number(process.env.ADMIN_USER_ID);
const adminID = adminPrefixes + IP_Address_Code + String(adminUserID);
const SALT = Number(process.env.SALT);
module.exports = {
    refreshThresholdInMs: Number(process.env.REFRESH_THRESHOLD_IN_MS) || 2 * 24 * 60 * 60 * 1000,
    userRegistrationCapacity: Number(process.env.USER_REGISTRATION_CAPACITY),
    adminUserID:adminUserID,
    adminID: adminID, // Admin userID
    IP_Address_Code: IP_Address_Code, // Unique per machine
    SALT: SALT,
    secretCodeOfAccessToken: process.env.ACCESS_TOKEN_SECRET_CODE,
    secretCodeOfRefreshToken: process.env.REFRESH_TOKEN_SECRET_CODE,
    expiryTimeOfAccessToken: Number(process.env.ACCESS_TOKEN_EXPIRY),
    expiryTimeOfRefreshToken: Number(process.env.REFRESH_TOKEN_EXPIRY),
    adminUser:{
        name: process.env.ADMIN_NAME,
        phoneNumber: {
            countryCode: process.env.ADMIN_COUNTRY_CODE,
            number: process.env.ADMIN_NUMBER
        },
        fullPhoneNumber: process.env.ADMIN_FULL_PHONE_NUMBER,
        // Password is Encypted to make the Password more complicated to crack
        // When Someone by Chance get access to Database if password is stored in Encrypted format
        // It makes it complicated to decode and hence it increases the security of User Data Privacy
        // There are so many methods for Hashing , in this project I used SALT Based Hashing
        // SALT is bascially a Random Text (Can be String or Number) is added to password
        password: process.env.ADMIN_PASSWORD,
        emailID: process.env.ADMIN_EMAIL_ID,
        userType: "ADMIN",
        userID: adminID,
        devices: {
            info: []
        }
    },
    // 🎯 Admin Action Reasons - Enum Based Design
    AdminActionReasons: Object.freeze({
        CHECK_USER_ACTIVITY: "ToCheckUserActivity",
        VERIFY_ACCOUNT_STATUS: "ToVerifyAccountStatus",
        AUDIT_LOG_PURPOSE: "ToAuditUserLogs",
        RESET_PASSWORD_REQUESTED: "PasswordResetVerification",
        USER_RAISED_ISSUE: "UserRaisedIssue",
        ACCOUNT_VERIFICATION: "VerifyUserManually"
        // Add more as your system scales
    }),
    BLOCK_REASONS: Object.freeze({
        POLICY_VIOLATION: "policy_violation",
        SPAM_ACTIVITY: "spam_activity",
        HARASSMENT: "harassment",
        FRAUDULENT_BEHAVIOR: "fraudulent_behavior",
        SUSPICIOUS_LOGIN: "suspicious_login",
        OTHER: "other"
    }),
    UNBLOCK_REASONS: Object.freeze({
        MANUAL_REVIEW_PASSED: "manual_review_passed",
        USER_APPEAL_GRANTED: "user_appeal_granted",
        SYSTEM_ERROR: "system_error",
        OTHER: "other"
    }),
    deviceThreshold: {
        ADMIN: 2,
        CUSTOMERS: 5
    },
    usersPerDevice: 5
}