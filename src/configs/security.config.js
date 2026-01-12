module.exports = {
  SALT: Number(process.env.SALT),
  usersPerDevice: 5,
  deviceThreshold: {
    ADMIN: 2,
    CUSTOMER: 5
  },
  authMode: process.env.AUTH_MODE,
  verificationMode: process.env.VERIFICATION_MODE,
  otp: {
    length: 6,                // digits in OTP
    maxAttempts: 5,
    digits: "0123456789"      // OTP characters allowed
  },
  hashing: {
    algorithm: "sha256",
    encoding: "hex",
    saltLength: 16
  },
  passwordSecurity: {
    MAX_ATTEMPTS: 5,           // 5 baar galat password allow hai
    LOCKOUT_TIME_MINUTES: 15   // Uske baad 15 minute ka ban
  }
};
