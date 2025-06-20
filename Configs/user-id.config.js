const bcryptjs = require("bcryptjs");
const adminPrefixes = require("./id-prefixes.config").admin;
const IP_Address_Code = require("./ip-address.config").IP_Address_Code;
const adminUserID = Number(process.env.ADMIN_USER_ID);
const adminID = adminPrefixes + IP_Address_Code + String(adminUserID);
const SALT = Number(process.env.SALT);
module.exports = {
    refreshThresholdInMs: 2 * 24 * 60 * 60 * 1000, // e.g., rotate only if last token was issued 2 days ago
    userRegistrationCapacity: Number(process.env.USER_REGISTRATION_CAPACITY),
    adminUserID:adminUserID,
    adminID: adminID, // Admin userID
    IP_Address_Code: IP_Address_Code, // Unique per machine
    SALT: SALT,
    secretCode: process.env.JWT_SECRET,
    expiryTimeOfAccessToken: Number(process.env.ACCESS_TOKEN_EXPIRY),
    expiryTimeOfRefreshToken: Number(process.env.REFRESH_TOKEN_EXPIRY),
    adminUser:{
        name: process.env.ADMIN_NAME,
        phoneNumber: process.env.ADMIN_PHONE,
        // Password is Encypted to make the Password more complicated to crack
        // When Someone by Chance get access to Database if password is stored in Encrypted format
        // It makes it complicated to decode and hence it increases the security of User Data Privacy
        // There are so many methods for Hashing , in this project I used SALT Based Hashing
        // SALT is bascially a Random Text (Can be String or Number) is added to password
        password: process.env.ADMIN_PASSWORD,
        emailID: process.env.ADMIN_EMAIL_ID,
        userType: "Admin",
        userID: adminID
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
    }
}