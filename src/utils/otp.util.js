const crypto = require("crypto");
const { otp, hashing } = require("@configs/security.config");
const { algorithm, encoding, saltLength } = hashing;

const OTP_LENGTH = otp.length;
const OTP_DIGITS = otp.digits;

/**
 * Generate a random numeric OTP of given length
 */

const generateOTP = (length = OTP_LENGTH) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += OTP_DIGITS[Math.floor(Math.random() * OTP_DIGITS.length)];
  }
  return code;
};

/**
 * Hash OTP with a random salt
 */

const hashOTP = (otpCode) => {
  const salt = crypto.randomBytes(saltLength).toString(encoding); // per-OTP salt
  const otpHash = crypto.createHash(algorithm).update(otpCode + salt).digest(encoding);
  return { otpHash, salt };
};

/**
 * Verify OTP against hash & salt
 */

const verifyOTP = (inputOtp, otpHash, salt) => {
  const hashCheck = crypto.createHash(algorithm).update(inputOtp + salt).digest(encoding);
  return hashCheck === otpHash;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};
