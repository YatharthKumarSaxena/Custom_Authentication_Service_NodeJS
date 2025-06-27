// configs/user-enums.config.js
module.exports = Object.freeze({
  UNBLOCK_VIA: ["USER_ID", "EMAIL", "PHONE"],
  BLOCK_VIA: ["USER_ID", "EMAIL", "PHONE"],
  USER_TYPE: ["CUSTOMER", "ADMIN"],
  DEVICE_TYPES :["MOBILE", "TABLET", "LAPTOP"],
  immutableFields: [
    "_id", "__v",                     // Mongo internal
    "userID", "userType",             // Identity + Role
    "isVerified", "isBlocked",        // Security status
    "jwtTokenIssuedAt",               // Token control
    "createdAt", "updatedAt",         // System timestamps
    "isActive", "lastLogin",          // Lifecycle flags
    "verificationToken",              // Token used for verifying email/phone
    "blockReason","unblockReason",
    "blockedAt","unblockedAt",
    "lastActivatedAt","lastDeactivatedAt",
    "blockedBy","unblockedBy",
    "lastLogout","loginCount",
    "blockVia","unblockVia",
    "blockCount","devices","unblockCount",
    "passwordChangedAt","otp",
    "refreshToken","password",
    "timestamps","versionKey"
  ]
});
